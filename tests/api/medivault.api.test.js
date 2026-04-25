const request = require("supertest");
const { expect } = require("chai");

const app = require("../../backend/app");
const TestDatabase = require("../helpers/TestDatabase");
const TestServer = require("../helpers/TestServer");
const AuthFixture = require("../fixtures/AuthFixture");
const UserFixture = require("../fixtures/UserFixture");

const MedicalRecord = require("../../backend/models/MedicalRecord");
const RecordService = require("../../backend/services/RecordService");

describe("MediVault API Integration", function () {
  this.timeout(15000);

  let testDatabase;
  let testServer;
  let api;
  let authFixture;

  before(async () => {
    testDatabase = new TestDatabase();
    await testDatabase.connect();

    testServer = new TestServer(app);
    const server = await testServer.start();

    api = request(server);
    authFixture = new AuthFixture(api);
  });

  beforeEach(async () => {
    await testDatabase.clear();
  });

  after(async () => {
    await testServer.stop();
    await testDatabase.disconnect();
  });

  describe("Auth routes", () => {
    it("POST /api/auth/signup creates a user", async () => {
      const user = UserFixture.buildPatient();

      const res = await api.post("/api/auth/signup").send(user);

      expect(res.status).to.equal(201);
      expect(res.body.email).to.equal(user.email);
      expect(res.body.role).to.equal("patient");
    });

    it("POST /api/auth/signup rejects duplicate user", async () => {
      const user = UserFixture.buildPatient();

      await api.post("/api/auth/signup").send(user);
      const duplicateRes = await api.post("/api/auth/signup").send(user);

      expect(duplicateRes.status).to.equal(400);
      expect(duplicateRes.body.message).to.equal("User already exists");
    });

    it("POST /api/auth/login returns token for valid credentials", async () => {
      const { payload } = await authFixture.registerPatient();

      const loginRes = await api.post("/api/auth/login").send({
        email: payload.email,
        password: payload.password,
      });

      expect(loginRes.status).to.equal(200);
      expect(loginRes.body.token).to.be.a("string");
      expect(loginRes.body.user.email).to.equal(payload.email);
    });

    it("POST /api/auth/login rejects invalid credentials", async () => {
      const { payload } = await authFixture.registerPatient();

      const loginRes = await api.post("/api/auth/login").send({
        email: payload.email,
        password: "WrongPassword!",
      });

      expect(loginRes.status).to.equal(400);
      expect(loginRes.body.message).to.equal("Invalid credentials");
    });
  });

  describe("User routes", () => {
    it("GET /api/user/profile returns profile for authorized user", async () => {
      const auth = await authFixture.registerAndLoginPatient();

      const res = await api
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${auth.token}`);

      expect(res.status).to.equal(200);
      expect(res.body.email).to.equal(auth.payload.email);
      expect(res.body).to.not.have.property("password");
    });

    it("GET /api/user/profile blocks unauthorized access", async () => {
      const res = await api.get("/api/user/profile");

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal("Not authorized");
    });
  });

  describe("Record routes", () => {
    it("GET /api/records blocks unauthorized access", async () => {
      const res = await api.get("/api/records");

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal("Not authorized");
    });

    it("GET /api/records returns records for authenticated patient", async () => {
      const auth = await authFixture.registerAndLoginPatient();

      await MedicalRecord.create({
        user: auth.user.id,
        fileName: "report.pdf",
        originalName: "report.pdf",
        fileUrl: "https://example.test/files/report.pdf",
        publicId: "public-id-1",
        size: 1024,
      });

      const res = await api
        .get("/api/records")
        .set("Authorization", `Bearer ${auth.token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an("array");
      expect(res.body.data).to.have.length(1);
      expect(res.body.data[0].originalName).to.equal("report.pdf");
    });

    it("POST /api/records/upload handles invalid payload", async () => {
      const auth = await authFixture.registerAndLoginPatient();

      const res = await api
        .post("/api/records/upload")
        .set("Authorization", `Bearer ${auth.token}`);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal("No file uploaded");
    });

    it("POST /api/records/upload succeeds with mocked upload service", async () => {
      const auth = await authFixture.registerAndLoginPatient();
      const originalUploadMedicalRecord = RecordService.uploadMedicalRecord;

      RecordService.uploadMedicalRecord = async () => ({
        _id: "record-id",
        fileName: "lab-report.pdf",
        fileUrl: "https://example.test/files/lab-report.pdf",
        createdAt: new Date().toISOString(),
      });

      try {
        const res = await api
          .post("/api/records/upload")
          .set("Authorization", `Bearer ${auth.token}`)
          .attach("file", Buffer.from("dummy file"), "lab-report.pdf");

        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal("Upload successful");
        expect(res.body.record.fileName).to.equal("lab-report.pdf");
      } finally {
        RecordService.uploadMedicalRecord = originalUploadMedicalRecord;
      }
    });

    it("DELETE /api/records/:id currently returns 404 (route not implemented yet)", async () => {
      const auth = await authFixture.registerAndLoginPatient();

      const res = await api
        .delete("/api/records/507f191e810c19729de860ea")
        .set("Authorization", `Bearer ${auth.token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe("Emergency routes", () => {
    it("GET /api/emergency/me requires auth", async () => {
      const res = await api.get("/api/emergency/me");

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal("Not authorized");
    });

    it("GET /api/public/emergency/:token returns public profile after enabling access", async () => {
      const auth = await authFixture.registerAndLoginPatient();
      const authHeader = { Authorization: `Bearer ${auth.token}` };

      const setupRes = await api
        .post("/api/emergency/setup")
        .set(authHeader)
        .send({
          fullName: "Patient Emergency",
          age: 42,
          bloodGroup: "o+",
          allergies: ["Penicillin"],
          conditions: ["Asthma"],
          medications: ["Inhaler"],
          emergencyContacts: [
            {
              name: "John Contact",
              relation: "Brother",
              phone: "1234567890",
            },
          ],
          notes: "Carries inhaler",
        });

      expect(setupRes.status).to.equal(200);
      expect(setupRes.body.success).to.equal(true);

      const toggleRes = await api
        .patch("/api/emergency/toggle")
        .set(authHeader)
        .send({ enabled: true });

      expect(toggleRes.status).to.equal(200);
      expect(toggleRes.body.success).to.equal(true);

      const meRes = await api.get("/api/emergency/me").set(authHeader);
      expect(meRes.status).to.equal(200);
      expect(meRes.body.success).to.equal(true);

      const token = meRes.body.data.emergencyToken;
      const publicRes = await api.get(`/api/public/emergency/${token}`);

      expect(publicRes.status).to.equal(200);
      expect(publicRes.body.success).to.equal(true);
      expect(publicRes.body.data.fullName).to.equal("Patient Emergency");
      expect(publicRes.body.data.bloodGroup).to.equal("O+");
    });

    it("GET /api/public/emergency/:token rejects invalid token", async () => {
      const res = await api.get("/api/public/emergency/invalid-token");

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
      expect(res.body.message).to.equal("Invalid token");
    });
  });
});
