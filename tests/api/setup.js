const EnvLoader = require("../helpers/loadTestEnv");

EnvLoader.load();
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_TEST || "medivault-test-secret";
