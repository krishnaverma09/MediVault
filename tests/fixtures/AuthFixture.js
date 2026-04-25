const UserFixture = require("./UserFixture");

class AuthFixture {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async registerPatient(overrides = {}) {
    const payload = UserFixture.buildPatient(overrides);
    const response = await this.apiClient.post("/api/auth/signup").send(payload);
    return { payload, response };
  }

  async registerDoctor(overrides = {}) {
    const payload = UserFixture.buildDoctor(overrides);
    const response = await this.apiClient.post("/api/auth/signup").send(payload);
    return { payload, response };
  }

  async login({ email, password }) {
    return this.apiClient.post("/api/auth/login").send({ email, password });
  }

  async registerAndLoginPatient(overrides = {}) {
    const { payload, response: registerResponse } = await this.registerPatient(overrides);
    const loginResponse = await this.login(payload);

    return {
      payload,
      registerResponse,
      loginResponse,
      token: loginResponse.body.token,
      user: loginResponse.body.user,
    };
  }
}

module.exports = AuthFixture;
