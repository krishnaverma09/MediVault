const Appointment = require('../models/Appointment');

const createAppointment = async (data) => {
  const User = require('../models/User');
  const doctor = await User.findOne({ _id: data.doctorId, role: 'doctor' });
  if (!doctor) throw Object.assign(new Error('Doctor not found'), { statusCode: 400 });
  if (!Number.isFinite(data.date.getTime()) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) {
    throw Object.assign(new Error('Invalid appointment date or time'), { statusCode: 400 });
  }
  if (new Date(`${data.date.toISOString().slice(0, 10)}T${data.time}:00+05:30`) <= new Date()) {
    throw Object.assign(new Error('Choose a future appointment time'), { statusCode: 400 });
  }
  const appointment = new Appointment(data);
  return await appointment.save();
};

const getPatientAppointments = async (patientId) => {
  return await Appointment.find({ patientId }).populate('doctorId', 'name email').sort({ date: -1 });
};

const getDoctorAppointments = async (doctorId) => {
  return await Appointment.find({ doctorId }).populate('patientId', 'name email').sort({ date: -1 });
};

const updateAppointmentStatus = async (appointmentId, doctorId, status, notes = '') => {
  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }
  return await Appointment.findOneAndUpdate(
    { _id: appointmentId, doctorId, status: status === 'Completed' ? 'Accepted' : 'Pending' },
    updateData,
    { new: true }
  ).populate('patientId doctorId', 'name email');
};

const cancelAppointment = async (appointmentId, patientId) => {
  return await Appointment.findOneAndUpdate(
    { _id: appointmentId, patientId, status: { $in: ['Pending', 'Accepted'] } },
    { status: 'Cancelled' },
    { new: true }
  );
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
