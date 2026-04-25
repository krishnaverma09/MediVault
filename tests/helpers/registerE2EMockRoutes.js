const { createInitialE2EState } = require("../mocks/e2eApiSeed");

class E2EMockApiRouter {
  constructor(page, initialState = createInitialE2EState()) {
    this.page = page;
    this.state = initialState;
  }

  get corsHeaders() {
    return {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    };
  }

  async register() {
    const handler = this.handleRoute.bind(this);
    await this.page.route("**://localhost:3001/**", handler);
    await this.page.route("**://127.0.0.1:3001/**", handler);
  }

  parseJsonBody(request) {
    const payload = request.postData();
    if (!payload) {
      return {};
    }

    try {
      return JSON.parse(payload);
    } catch {
      return {};
    }
  }

  isAuthorized(request) {
    const header = request.headers().authorization || "";
    return header === `Bearer ${this.state.authToken}`;
  }

  createPublicUrl(token) {
    return `http://localhost:3001/api/public/emergency/${token}`;
  }

  json(route, status, payload) {
    return route.fulfill({
      status,
      headers: this.corsHeaders,
      body: JSON.stringify(payload),
    });
  }

  noContent(route) {
    return route.fulfill({
      status: 204,
      headers: this.corsHeaders,
      body: "",
    });
  }

  unauthorized(route) {
    return this.json(route, 401, { message: "Not authorized" });
  }

  async handleRoute(route) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname;

    if (method === "OPTIONS") {
      return this.noContent(route);
    }

    if (method === "POST" && pathname === "/api/auth/signup") {
      const body = this.parseJsonBody(request);

      if (!body.email || !body.password || !body.name) {
        return this.json(route, 400, { message: "Signup failed" });
      }

      this.state.user = {
        _id: this.state.user._id,
        id: this.state.user.id,
        name: body.name,
        email: body.email,
        role: body.role || "patient",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.state.userPassword = body.password;

      return this.json(route, 201, {
        id: this.state.user._id,
        name: this.state.user.name,
        email: this.state.user.email,
        role: this.state.user.role,
        createdAt: this.state.user.createdAt,
        updatedAt: this.state.user.updatedAt,
      });
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const body = this.parseJsonBody(request);

      if (body.email !== this.state.user.email || body.password !== (this.state.userPassword || "Password123!")) {
        return this.json(route, 400, { message: "Invalid credentials" });
      }

      return this.json(route, 200, {
        token: this.state.authToken,
        user: this.state.user,
      });
    }

    const isPublicEmergency = method === "GET" && pathname.startsWith("/api/public/emergency/");

    if (pathname.startsWith("/api/") && !isPublicEmergency && !this.isAuthorized(request)) {
      return this.unauthorized(route);
    }

    if (method === "GET" && pathname === "/api/user/profile") {
      return this.json(route, 200, this.state.user);
    }

    if (method === "GET" && pathname === "/api/user/doctors") {
      return this.json(route, 200, this.state.doctors);
    }

    if (method === "GET" && pathname === "/api/records") {
      return this.json(route, 200, { data: this.state.records });
    }

    if (method === "GET" && pathname === "/api/documents/patient/my-documents") {
      return this.json(route, 200, {
        success: true,
        data: this.state.documents,
      });
    }

    if (method === "POST" && pathname === "/api/documents/upload-and-share") {
      const newDoc = {
        _id: `doc-${Date.now()}`,
        title: "Mock Uploaded Document",
        documentType: "Report",
        description: "Uploaded in Playwright",
        fileUrl: "https://example.test/files/mock-upload.pdf",
        createdAt: new Date().toISOString(),
      };

      this.state.documents.unshift(newDoc);

      return this.json(route, 201, {
        success: true,
        message: "Document uploaded and shared successfully",
        data: newDoc,
      });
    }

    if (method === "GET" && pathname === "/api/emergency/me") {
      return this.json(route, 200, {
        success: true,
        message: "Emergency profile fetched",
        data: this.state.emergency,
      });
    }

    if (method === "POST" && pathname === "/api/emergency/setup") {
      const body = this.parseJsonBody(request);
      this.state.emergency = {
        ...this.state.emergency,
        emergencyProfile: {
          ...this.state.emergency.emergencyProfile,
          ...body,
        },
        updatedAt: new Date().toISOString(),
      };

      return this.json(route, 200, {
        success: true,
        message: "Emergency profile saved",
        data: this.state.emergency,
      });
    }

    if (method === "PATCH" && pathname === "/api/emergency/toggle") {
      const body = this.parseJsonBody(request);
      this.state.emergency.emergencyAccessEnabled = Boolean(body.enabled);

      return this.json(route, 200, {
        success: true,
        message: "Emergency access updated",
        data: this.state.emergency,
      });
    }

    if (method === "POST" && pathname === "/api/emergency/regenerate") {
      const token = `${Date.now()}${"b".repeat(36)}`.slice(0, 48);
      this.state.emergency.emergencyToken = token;
      this.state.emergency.publicUrl = this.createPublicUrl(token);

      return this.json(route, 200, {
        success: true,
        message: "Emergency token regenerated",
        data: this.state.emergency,
      });
    }

    if (method === "GET" && pathname === "/api/emergency/qr") {
      return this.json(route, 200, {
        success: true,
        message: "Emergency QR code generated",
        data: {
          publicUrl: this.state.emergency.publicUrl,
          emergencyAccessEnabled: this.state.emergency.emergencyAccessEnabled,
          qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
        },
      });
    }

    if (isPublicEmergency) {
      const token = pathname.split("/").pop();
      const isValidToken = token === this.state.emergency.emergencyToken;

      if (!isValidToken || !this.state.emergency.emergencyAccessEnabled) {
        return this.json(route, 404, {
          success: false,
          message: "Emergency profile unavailable",
        });
      }

      return this.json(route, 200, {
        success: true,
        message: "Emergency profile fetched",
        data: this.state.emergency.emergencyProfile,
      });
    }

    return this.json(route, 404, {
      success: false,
      message: `No mock route for ${method} ${pathname}`,
    });
  }
}

module.exports = E2EMockApiRouter;
