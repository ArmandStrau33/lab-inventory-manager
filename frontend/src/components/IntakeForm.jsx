import React, {useState} from 'react'
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Grid,
  Divider,
  Avatar,
  LinearProgress
} from '@mui/material'
import {
  Science,
  Person,
  Email,
  Schedule,
  LocationOn,
  Notes,
  Send,
  CheckCircle
} from '@mui/icons-material'
import axios from 'axios'

export default function IntakeForm(){
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState({
    teacher_name:'', 
    teacher_email:'', 
    experiment_title:'', 
    materials:'', 
    preferred_date:'', 
    preferred_lab:'', 
    notes:''
  })
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = ['Basic Info', 'Experiment Details', 'Schedule & Submit']

  const labOptions = ['Lab A', 'Lab B', 'Lab C', 'Lab D']

  function onChange(e){
    setForm({...form, [e.target.name]: e.target.value})
  }

  function nextStep() {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  function prevStep() {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  async function submit(e){
    e.preventDefault()
    setIsSubmitting(true)
    setStatus('Submitting your request...')
    
    const payload = {
      teacher_name: form.teacher_name,
      teacher_email: form.teacher_email,
      experiment_title: form.experiment_title,
      materials: form.materials.split(',').map(s=>s.trim()).filter(Boolean),
      preferred_date: form.preferred_date || null,
      preferred_lab: form.preferred_lab || null,
      notes: form.notes || null
    }

    try{
      const url = '/submit'
      const res = await axios.post(url, payload)
      setStatus(`✅ Request submitted successfully! ID: ${res.data?.id || 'N/A'}`)
      setForm({teacher_name:'', teacher_email:'', experiment_title:'', materials:'', preferred_date:'', preferred_lab:'', notes:''})
      setActiveStep(0)
    }catch(err){
      console.error(err)
      setStatus(`❌ Error: ${err.response?.data?.error || err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch(activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Teacher Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Full Name" 
                name="teacher_name" 
                value={form.teacher_name} 
                onChange={onChange} 
                required 
                fullWidth
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Email Address" 
                name="teacher_email" 
                type="email"
                value={form.teacher_email} 
                onChange={onChange} 
                required 
                fullWidth
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
          </Grid>
        )
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Science />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Experiment Details
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Experiment Title" 
                name="experiment_title" 
                value={form.experiment_title} 
                onChange={onChange} 
                required 
                fullWidth
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Required Materials" 
                name="materials" 
                value={form.materials} 
                onChange={onChange} 
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                helperText="Enter materials separated by commas (e.g., 1x beaker, sodium chloride, safety goggles)"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              {form.materials && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Materials Preview:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {form.materials.split(',').map(s=>s.trim()).filter(Boolean).map((material, index) => (
                      <Chip 
                        key={index} 
                        label={material} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        )
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Schedule & Additional Info
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Preferred Date" 
                name="preferred_date" 
                type="datetime-local"
                value={form.preferred_date} 
                onChange={onChange} 
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Preferred Lab" 
                name="preferred_lab" 
                select
                value={form.preferred_lab} 
                onChange={onChange} 
                fullWidth
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              >
                {labOptions.map(lab => (
                  <MenuItem key={lab} value={lab}>{lab}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Additional Notes" 
                name="notes" 
                value={form.notes} 
                onChange={onChange} 
                fullWidth
                multiline 
                rows={3}
                variant="outlined"
                placeholder="Any special requirements, safety considerations, or additional information..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
          </Grid>
        )
      
      default:
        return null
    }
  }

  const isStepValid = () => {
    switch(activeStep) {
      case 0:
        return form.teacher_name && form.teacher_email
      case 1:
        return form.experiment_title
      case 2:
        return true
      default:
        return false
    }
  }

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ p: 4 }}>
        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                StepIconProps={{
                  style: {
                    color: index <= activeStep ? '#667eea' : '#ccc'
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: 300, mb: 4 }}>
          {renderStepContent()}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            disabled={activeStep === 0}
            onClick={prevStep}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Back
          </Button>

          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={nextStep}
                disabled={!isStepValid()}
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                onClick={submit}
                disabled={!isStepValid() || isSubmitting}
                startIcon={isSubmitting ? null : <Send />}
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  position: 'relative'
                }}
              >
                {isSubmitting ? (
                  <>
                    <LinearProgress 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        borderRadius: 3
                      }} 
                    />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            )}
          </Box>
        </Box>

        {/* Status Message */}
        {status && (
          <Box mt={3}>
            <Alert 
              severity={status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}
              sx={{ borderRadius: 3 }}
            >
              {status}
            </Alert>
          </Box>
        )}

        {/* Request Summary */}
        {activeStep === steps.length - 1 && (
          <Box mt={3}>
            <Card sx={{ bgcolor: '#f8fafc', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary">
                  Request Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Teacher</Typography>
                    <Typography variant="body1" fontWeight="600">{form.teacher_name || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" fontWeight="600">{form.teacher_email || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Experiment</Typography>
                    <Typography variant="body1" fontWeight="600">{form.experiment_title || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Materials</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {form.materials.split(',').map(s=>s.trim()).filter(Boolean).map((material, index) => (
                        <Chip key={index} label={material} size="small" />
                      ))}
                    </Box>
                  </Grid>
                  {form.preferred_date && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Preferred Date</Typography>
                      <Typography variant="body1" fontWeight="600">
                        {new Date(form.preferred_date).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {form.preferred_lab && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Preferred Lab</Typography>
                      <Typography variant="body1" fontWeight="600">{form.preferred_lab}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// TODOs:
// - Add client-side validation for email and date ranges
// - Integrate CAPTCHA or invisible bot protection if public
// - Add analytics event on submit and error tracking
// - Add E2E tests (Cypress) for the multi-step flow
// NEXT ACTION (ROADMAP):
// 1) Add simple email regex validation and a date range check (no past dates).
// 2) Emit a 'lab_request_submitted' analytics event with minimal payload (id, teacher_email domain).
