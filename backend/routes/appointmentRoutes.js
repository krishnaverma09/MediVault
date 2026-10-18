const authorize = require("../middleware/authorize");
const express = require('express');
const router = express.Router();

const {
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');

// Requires actual authMiddleware from the project
// Assuming `authMiddleware` injects `req.user.id` into the request
const protect = require('../middleware/authMiddleware'); 

// ---------------- Patient Endpoints ----------------
// POST /api/appointments
router.post('/', protect, authorize('patient'), bookAppointment);

// GET /api/appointments/patient
router.get('/patient', protect, authorize('patient'), getPatientAppointments);

// DELETE /api/appointments/:id
router.delete('/:id', protect, authorize('patient'), cancelAppointment);

// ---------------- Doctor Endpoints ----------------
// GET /api/appointments/doctor
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);

// Use PUT /api/appointments/:id/accept => Use updateAppointmentStatus action
router.put('/:id/accept', protect, authorize('doctor'), (req, res, next) => {
  req.body = req.body || {};
  req.body.action = 'accept';
  updateAppointmentStatus(req, res, next);
});

// PUT /api/appointments/:id/reject
router.put('/:id/reject', protect, authorize('doctor'), (req, res, next) => {
  req.body = req.body || {};
  req.body.action = 'reject';
  updateAppointmentStatus(req, res, next);
});

// PUT /api/appointments/:id/complete
router.put('/:id/complete', protect, authorize('doctor'), (req, res, next) => {
  req.body = req.body || {};
  req.body.action = 'complete';
  updateAppointmentStatus(req, res, next);
});

module.exports = router;
