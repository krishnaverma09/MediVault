const request = require('supertest');
const { expect } = require('chai');
const app = require('../../backend/app');
const TestDatabase = require('../helpers/TestDatabase');
const MedicalDocument = require('../../backend/models/MedicalDocument');
const MedicalRecord = require('../../backend/models/MedicalRecord');
const DocumentShare = require('../../backend/models/DocumentShare');
const DocumentShareService = require('../../backend/services/DocumentShareService');

describe('Complete feature regressions', function () {
  this.timeout(20000);
  const db = new TestDatabase();
  let api, server, patient, otherPatient, doctor, otherDoctor;
  const header = account => ({ Authorization: `Bearer ${account.token}` });
  async function account(role, name) {
    const payload = { name, email: `${name}@example.test`, password: 'Password123!', role };
    expect((await api.post('/api/auth/signup').send(payload)).status).to.equal(201);
    return (await api.post('/api/auth/login').send(payload)).body;
  }
  before(async () => {
    await db.connect();
    server = app.listen(0);
    api = request(server);
  });
  beforeEach(async () => {
    await db.clear();
    patient = await account('patient', 'patient');
    otherPatient = await account('patient', 'other-patient');
    doctor = await account('doctor', 'doctor');
    otherDoctor = await account('doctor', 'other-doctor');
  });
  after(async () => { await new Promise(resolve => server.close(resolve)); await db.disconnect(); });

  it('uploads, lists, shares, enforces ownership and download permission, expires and revokes documents', async () => {
    const original = DocumentShareService.uploadFileToCloudinary;
    DocumentShareService.uploadFileToCloudinary = async () => ({ secure_url: 'https://example.test/report.pdf', public_id: 'regression-pdf' });
    let doc;
    try {
      const upload = await api.post('/api/documents/upload-and-share').set(header(patient))
        .field('title', 'Regression report').field('documentType', 'Report')
        .attach('file', Buffer.from('%PDF-1.4 regression'), { filename: 'report.pdf', contentType: 'application/pdf' });
      expect(upload.status).to.equal(201);
      doc = upload.body.data;
    } finally { DocumentShareService.uploadFileToCloudinary = original; }
    expect((await api.get(`/api/documents/patient/view/${doc._id}`).set(header(patient))).status).to.equal(200);
    expect((await api.get(`/api/documents/patient/view/${doc._id}`).set(header(otherPatient))).status).to.equal(404);
    const records = await api.get('/api/records').set(header(patient));
    expect(records.body.data.map(r => r._id)).to.include(doc._id);
    expect((await api.get('/api/records').set(header(doctor))).body.data).to.have.length(0);
    const shareBody = { documentId: doc._id, doctorEmail: doctor.user.email, permission: 'VIEW' };
    expect((await api.post('/api/documents/share').set(header(otherPatient)).send(shareBody)).status).to.equal(404);
    const shared = await api.post('/api/documents/share').set(header(patient)).send(shareBody);
    expect(shared.status).to.equal(200);
    const shareId = shared.body.data[0]._id;
    expect((await api.get('/api/records').set(header(doctor))).body.data).to.have.length(1);
    expect((await api.get('/api/records').set(header(otherDoctor))).body.data).to.have.length(0);
    expect((await api.get(`/api/documents/doctor/view/${shareId}`).set(header(doctor))).status).to.equal(200);
    expect((await api.get(`/api/documents/doctor/view/${shareId}?download=true`).set(header(doctor))).status).to.equal(403);
    expect((await api.get(`/api/documents/doctor/view/${shareId}`).set(header(otherDoctor))).status).to.equal(403);
    expect((await api.get(`/api/documents/access-logs/${doc._id}`).set(header(otherPatient))).status).to.equal(404);
    const logs = await api.get(`/api/documents/access-logs/${doc._id}`).set(header(patient));
    expect(logs.body.data.map(log => log.action)).to.include('VIEW');
    await api.post('/api/documents/share').set(header(patient)).send({ ...shareBody, permission: 'DOWNLOAD' });
    expect((await api.get(`/api/documents/doctor/view/${shareId}?download=true`).set(header(doctor))).status).to.equal(200);
    await DocumentShare.findByIdAndUpdate(shareId, { expiresAt: new Date(Date.now() - 1000) });
    expect((await api.get(`/api/documents/doctor/view/${shareId}`).set(header(doctor))).status).to.equal(403);
    await api.post('/api/documents/share').set(header(patient)).send(shareBody);
    expect((await api.get(`/api/documents/shares/${doc._id}`).set(header(patient))).body.data).to.have.length(1);
    expect((await api.delete(`/api/documents/share/${shareId}`).set(header(patient))).status).to.equal(200);
    expect((await api.get('/api/records').set(header(doctor))).body.data).to.have.length(0);
    expect((await api.get(`/api/documents/doctor/view/${shareId}`).set(header(doctor))).status).to.equal(403);
  });

  it('supports sharing legacy uploads without exposing other patients records', async () => {
    const record = await MedicalRecord.create({ user: patient.user.id, fileName: 'legacy.pdf', originalName: 'legacy.pdf', fileUrl: 'https://example.test/legacy.pdf', publicId: 'legacy', size: 100 });
    expect((await api.get('/api/records').set(header(doctor))).body.data).to.have.length(0);
    const share = await api.post('/api/documents/share').set(header(patient)).send({ documentId: record.id, doctorEmail: doctor.user.email });
    expect(share.status).to.equal(200);
    expect((await api.get('/api/records').set(header(patient))).body.data).to.have.length(1);
    expect((await api.get('/api/records').set(header(doctor))).body.data).to.have.length(1);
  });

  it('books, accepts, completes and cancels appointments only for the assigned participants', async () => {
    const payload = { doctorId: doctor.user.id, date: '2099-01-20', time: '10:00', reason: 'Regression check' };
    const booking = await api.post('/api/appointments').set(header(patient)).send(payload);
    expect(booking.status).to.equal(201);
    const id = booking.body.data._id;
    expect((await api.get('/api/appointments/doctor').set(header(doctor))).body.data).to.have.length(1);
    expect((await api.put(`/api/appointments/${id}/accept`).set(header(patient))).status).to.equal(403);
    expect((await api.put(`/api/appointments/${id}/accept`).set(header(otherDoctor))).status).to.equal(404);
    expect((await api.delete(`/api/appointments/${id}`).set(header(otherPatient))).status).to.equal(404);
    expect((await api.put(`/api/appointments/${id}/complete`).set(header(doctor))).status).to.equal(404);
    expect((await api.put(`/api/appointments/${id}/accept`).set(header(doctor))).status).to.equal(200);
    expect((await api.put(`/api/appointments/${id}/complete`).set(header(doctor)).send({ notes: 'Checked' })).body.data.status).to.equal('Completed');
    expect((await api.delete(`/api/appointments/${id}`).set(header(patient))).status).to.equal(404);
    const second = await api.post('/api/appointments').set(header(patient)).send({ ...payload, time: '11:00' });
    expect((await api.delete(`/api/appointments/${second.body.data._id}`).set(header(patient))).body.data.status).to.equal('Cancelled');
    expect((await api.post('/api/appointments').set(header(patient)).send({ ...payload, doctorId: otherPatient.user.id })).status).to.equal(400);
  });

  it('creates, edits and deletes vitals, calculates analytics and isolates histories', async () => {
    const created = await api.post('/api/analytics/vitals').set(header(patient)).send({ date: '2026-10-18', weight: 70, height: 175, heartRate: 72, sleepHours: 8 });
    expect(created.status).to.equal(201);
    const id = created.body.data._id;
    expect(created.body.data.bmi).to.be.closeTo(22.86, 0.01);
    expect((await api.get('/api/analytics/dashboard').set(header(patient))).status).to.equal(200);
    expect((await api.get('/api/analytics/summary').set(header(patient))).status).to.equal(200);
    expect((await api.get('/api/analytics/vitals').set(header(otherPatient))).body.data).to.have.length(0);
    expect((await api.put(`/api/analytics/vitals/${id}`).set(header(otherPatient)).send({ weight: 80 })).status).to.equal(404);
    expect((await api.put(`/api/analytics/vitals/${id}`).set(header(patient)).send({ weight: 75 })).body.data.weight).to.equal(75);
    expect((await api.delete(`/api/analytics/vitals/${id}`).set(header(patient))).status).to.equal(200);
  });

  it('generates HTTPS QR links, rotates tokens, and disables public access', async () => {
    const me = await api.get('/api/emergency/me').set(header(patient)).set('X-Forwarded-Proto', 'https');
    expect(me.body.data.publicUrl).to.match(/^https:/);
    const token = me.body.data.emergencyToken;
    const qr = await api.get('/api/emergency/qr').set(header(patient));
    expect(qr.body.data.qrDataUrl).to.match(/^data:image\/png;base64,/);
    await api.patch('/api/emergency/toggle').set(header(patient)).send({ enabled: true });
    expect((await api.get(`/api/public/emergency/${token}`)).status).to.equal(200);
    const rotated = await api.post('/api/emergency/regenerate').set(header(patient));
    expect((await api.get(`/api/public/emergency/${token}`)).status).to.equal(404);
    await api.patch('/api/emergency/toggle').set(header(patient)).send({ enabled: false });
    expect((await api.get(`/api/public/emergency/${rotated.body.data.emergencyToken}`)).status).to.equal(404);
  });
});
