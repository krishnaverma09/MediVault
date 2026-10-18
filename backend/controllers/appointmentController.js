const appointmentService = require('../services/AppointmentService');

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    // Assuming patientId is attached via authMiddleware to req.user.id
    const patientId = req.user.id;

    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const newAppointment = await appointmentService.createAppointment({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      reason,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Appointment booked successfully.', data: newAppointment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: 'Error booking appointment', error: error.message });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await appointmentService.getPatientAppointments(patientId);
    
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: 'Error retrieving appointments', error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;

    const cancelledAppointment = await appointmentService.cancelAppointment(id, patientId);
    
    if (!cancelledAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not authorized to cancel.' });
    }

    res.status(200).json({ success: true, message: 'Appointment cancelled.', data: cancelledAppointment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: 'Error cancelling appointment', error: error.message });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id; // Verify req.user.role === 'Doctor' via middleware if possible
    const appointments = await appointmentService.getDoctorAppointments(doctorId);
    
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: 'Error retrieving appointments', error: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // accept, reject, complete
    const { notes } = req.body; // optional notes

    let status = '';

    switch (action) {
      case 'accept':
        status = 'Accepted';
        break;
      case 'reject':
        status = 'Rejected';
        break;
      case 'complete':
        status = 'Completed';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action provided.' });
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(id, req.user.id, status, notes);

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.status(200).json({ success: true, message: `Appointment ${status.toLowerCase()} successfully.`, data: updatedAppointment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: 'Error updating appointment status', error: error.message });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus
};
