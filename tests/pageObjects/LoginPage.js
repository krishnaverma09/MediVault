class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async gotoLogin() {
    await this.page.goto("/login");
  }

  async gotoSignup() {
    await this.page.goto("/signup");
  }

  async signup({ name, email, password, role = "patient" }) {
    await this.gotoSignup();
    await this.page.fill("#name", name);
    await this.page.fill("#email", email);
    await this.page.fill("#password", password);
    await this.page.selectOption("#role", role);
    await this.page.getByRole("button", { name: "Create Account" }).click();
  }

  async login(email, password) {
    await this.gotoLogin();
    await this.page.fill("#email", email);
    await this.page.fill("#password", password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }
}

module.exports = LoginPage;
