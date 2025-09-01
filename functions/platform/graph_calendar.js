const axios = require('axios');

class GraphCalendarAdapter {
  // accessTokenProvider: optional function that returns a Promise resolving to a token string
  constructor(accessTokenProvider) {
    this.accessTokenProvider = accessTokenProvider;
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
  }

  async getCalendarEvents(calendarId, startTime, endTime) {
  try {
      const url = `${this.baseUrl}/users/${calendarId}/calendar/calendarView`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
        params: {
          startDateTime: startTime,
          endDateTime: endTime
        }
      });

      return response.data.value;
    } catch (error) {
      console.error('Error getting calendar events:', error && (error.response && error.response.data) || error.message)
      // TODO: consider caching free/busy results for short windows to reduce Graph calls
      throw error;
    }
  }

  async findMeetingTimes(attendees, startTime, endTime, duration = 'PT90M') {
    try {
      const url = `${this.baseUrl}/me/calendar/getSchedule`;
      
  const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
  const response = await axios.post(url, {
        schedules: attendees,
        startTime: {
          dateTime: startTime,
          timeZone: 'South Africa Standard Time'
        },
        endTime: {
          dateTime: endTime,
          timeZone: 'South Africa Standard Time'
        },
        availabilityViewInterval: 60
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

  return response.data.value;
    } catch (error) {
  console.error('Error finding meeting times:', error && (error.response && error.response.data) || error.message)
  // NEXT: implement retries for transient failures and document timeZone handling
  throw error;
    }
  }

  async createEvent(calendarId, eventData) {
    try {
      const url = `${this.baseUrl}/users/${calendarId}/calendar/events`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.post(url, eventData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error && (error.response && error.response.data) || error.message)
      // TODO: on 409/conflict check and attempt to find next slot
      throw error;
    }
  }

  async updateEvent(calendarId, eventId, eventData) {
    try {
      const url = `${this.baseUrl}/users/${calendarId}/calendar/events/${eventId}`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.patch(url, eventData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  async deleteEvent(calendarId, eventId) {
    try {
      const url = `${this.baseUrl}/users/${calendarId}/calendar/events/${eventId}`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      await axios.delete(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  // Lab-specific methods
  async checkLabAvailability(labCalendarId, requestedDate, duration = 90) {
    const startTime = new Date(requestedDate);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const events = await this.getCalendarEvents(
      labCalendarId,
      startTime.toISOString(),
      endTime.toISOString()
    );

    return {
      available: events.length === 0,
      conflictingEvents: events
    };
  }

  async bookLabSlot(labCalendarId, requestData, duration = 90) {
    const startTime = new Date(requestData.preferred_date || new Date());
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const eventData = {
      subject: `Lab Booking: ${requestData.experiment_title} — ${requestData.teacher_name}`,
      body: {
        contentType: 'HTML',
        content: `
          <h3>Lab Request Details</h3>
          <p><strong>Teacher:</strong> ${requestData.teacher_name}</p>
          <p><strong>Email:</strong> ${requestData.teacher_email}</p>
          <p><strong>Experiment:</strong> ${requestData.experiment_title}</p>
          <p><strong>Materials:</strong> ${requestData.materials.join(', ')}</p>
          <p><strong>Notes:</strong> ${requestData.notes || 'None'}</p>
        `
      },
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'South Africa Standard Time'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'South Africa Standard Time'
      },
      attendees: [
        {
          emailAddress: {
            address: requestData.teacher_email,
            name: requestData.teacher_name
          }
        }
      ],
      location: {
        displayName: requestData.preferred_lab || 'Lab'
      }
    };

    return await this.createEvent(labCalendarId, eventData);
  }

  async findNextAvailableSlot(labCalendarId, preferredDate, duration = 90, workingHours = { start: 7.5, end: 16 }) {
    let currentDate = new Date(preferredDate);
    const maxDaysToCheck = 14; // Check up to 2 weeks ahead
    
    for (let day = 0; day < maxDaysToCheck; day++) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(Math.floor(workingHours.start), (workingHours.start % 1) * 60, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(Math.floor(workingHours.end), (workingHours.end % 1) * 60, 0, 0);
      
      // Check availability in 30-minute increments
      for (let time = new Date(dayStart); time < dayEnd; time.setMinutes(time.getMinutes() + 30)) {
        const slotEnd = new Date(time.getTime() + duration * 60000);
        
        if (slotEnd > dayEnd) break; // Slot would extend beyond working hours
        
        const availability = await this.checkLabAvailability(labCalendarId, time.toISOString(), duration);
        
        if (availability.available) {
          return {
            startTime: time.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true
          };
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Skip weekends (assuming Saturday = 6, Sunday = 0)
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
      }
    }
    
    return {
      available: false,
      message: `No available slots found in the next ${maxDaysToCheck} days`
    };
  }
}

module.exports = GraphCalendarAdapter;

// TODOs:
// - Use MSAL helper for auth and refresh
// - Add caching for calendar free/busy queries to reduce Graph calls
// - Add tests for booking logic and fallback behavior
// NEXT ACTIONS:
// 1) Add a small free/busy cache (LRU with TTL) to reduce Graph traffic during slot searches.
// 2) Extract timezone handling into a helper and add unit tests for DST boundary cases.
// 3) Add mocks for Graph API responses to test booking conflict resolution.

// NEXT ACTIONS / TODOs for `functions/platform/graph_calendar.js`:
// - Normalize timezones: ensure preferred dates are converted to calendar timezone before booking.
// - Add conflict resolution policy and search range configuration (daysAhead, stepMinutes).
// - Add unit tests for conflict detection and slot finding.
// - Add retry/backoff for Graph calls and 429 handling.
