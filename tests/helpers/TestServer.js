class TestServer {
  constructor(app) {
    this.app = app;
    this.server = null;
  }

  async start(port = 0) {
    if (this.server) {
      return this.server;
    }

    await new Promise((resolve, reject) => {
      const candidate = this.app.listen(port, () => {
        this.server = candidate;
        resolve();
      });

      candidate.on("error", reject);
    });

    return this.server;
  }

  async stop() {
    if (!this.server) {
      return;
    }

    await new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.server = null;
  }

  getUrl() {
    if (!this.server) {
      return "";
    }

    const address = this.server.address();
    if (!address || typeof address === "string") {
      return "";
    }

    return `http://127.0.0.1:${address.port}`;
  }
}

module.exports = TestServer;
