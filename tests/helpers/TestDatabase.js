const mongoose = require("../../backend/node_modules/mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

class TestDatabase {
  constructor() {
    this.mongoServer = null;
  }

  async connect() {
    if (this.mongoServer) {
      return;
    }

    this.mongoServer = await MongoMemoryServer.create();
    const uri = this.mongoServer.getUri("medivault_test");

    process.env.MONGO_URI = uri;
    process.env.MONGO_URI_TEST = uri;

    await mongoose.connect(uri);
  }

  async clear() {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  }

  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (this.mongoServer) {
      await this.mongoServer.stop();
      this.mongoServer = null;
    }
  }
}

module.exports = TestDatabase;
