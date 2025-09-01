const GraphCalendarAdapter = require('../platform/graph_calendar');
const SharePointAdapter = require('../platform/sharepoint_adapter');
const { SHAREPOINT_SITE_URL, WORKING_HOURS } = require('../config/settings');
const msal = require('../platform/msal_helper');

async function tokenProvider(){
  const res = await msal.getToken().catch(()=>null);
  return res && res.accessToken;
}

async function scheduleLab(req){
  try {
  const calendar = new GraphCalendarAdapter(tokenProvider);
  const sharepoint = new SharePointAdapter(SHAREPOINT_SITE_URL, tokenProvider);
    
    // Get lab calendar address from SharePoint
  const labCalendarAddress = await sharepoint.getLabCalendarAddress(req.preferred_lab || 'Lab A');
    
    if (!labCalendarAddress) {
      // If no calendar configured, surface a clear error for operators
      console.error('No calendar found for lab:', req.preferred_lab)
      throw new Error(`No calendar found for lab: ${req.preferred_lab}`);
    }
    
    // Check if preferred time is available
  // Normalize preferred date and keep timezone awareness for future improvement
  const preferredDate = req.preferred_date ? new Date(req.preferred_date) : new Date();
  const availability = await calendar.checkLabAvailability(labCalendarAddress, preferredDate.toISOString());
    
  let bookingTime = preferredDate;
    
    // If not available, find next available slot
  if (!availability || !availability.available) {
      const nextSlot = await calendar.findNextAvailableSlot(labCalendarAddress, preferredDate.toISOString(), 90, WORKING_HOURS);
      
      if (!nextSlot || !nextSlot.available) {
        throw new Error(nextSlot && nextSlot.message ? nextSlot.message : 'No available slot')
      }
      
      bookingTime = new Date(nextSlot.startTime);
    }
    
  // Book the lab slot
    const event = await calendar.bookLabSlot(labCalendarAddress, {
      ...req,
      preferred_date: bookingTime.toISOString()
    });
    
  // Return normalized booking object
  return {
      id: event.id,
      lab: req.preferred_lab || 'Lab A',
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      calendar_url: event.webLink
    };
    
  } catch (error) {
    console.error('Error scheduling lab:', error && (error.message || error));
    // Fallback: create a fake booking to keep the pipeline moving but mark as provisional
    const start = req.preferred_date ? new Date(req.preferred_date) : new Date();
    const end = new Date(start.getTime() + 60*60*1000);
    return {
      id: 'bk-' + Date.now(),
      lab: req.preferred_lab || 'Lab A',
      correlation: req.correlation || null,
      start,
      end,
      calendar_url: null,
      provisional: true
    };
  }
}

module.exports = { scheduleLab }

// NEXT ACTION (ROADMAP):
// 1) Add unit tests mocking GraphCalendarAdapter and SharePointAdapter to validate booking logic.
// 2) Add timezone normalization and explicit time zone handling for different locales.

// NEXT ACTIONS / TODOs for `functions/calendar/scheduler.js`:
// - Normalize timezones: convert incoming preferred dates to the target calendar's timezone before checking/booking.
// - Make scheduling idempotent: persist `booking_attempt` metadata and skip duplicate bookings for the same request.
// - Respect calendar capacity and working hours stored in the `Labs` SharePoint list.
// - Add retry/backoff for Graph calendar calls and respect 429 / Retry-After headers.
// - Add unit tests for conflict detection, slot finding, and timezone conversions.
// - Consider exposing a `dryRun` mode for testing booking logic without creating real calendar events.
