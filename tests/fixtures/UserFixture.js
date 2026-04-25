class UserFixture {
  static uniqueSuffix() {
    return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  static buildPatient(overrides = {}) {
    const suffix = this.uniqueSuffix();
    return {
      name: `Test Patient ${suffix}`,
      email: `patient_${suffix}@medivault.test`,
      password: "Password123!",
      role: "patient",
      ...overrides,
    };
  }

  static buildDoctor(overrides = {}) {
    const suffix = this.uniqueSuffix();
    return {
      name: `Test Doctor ${suffix}`,
      email: `doctor_${suffix}@medivault.test`,
      password: "Password123!",
      role: "doctor",
      ...overrides,
    };
  }
}

module.exports = UserFixture;
