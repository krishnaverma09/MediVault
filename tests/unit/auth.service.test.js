jest.mock(
  "bcryptjs",
  () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  }),
  { virtual: true }
);

jest.mock(
  "jsonwebtoken",
  () => ({
    sign: jest.fn(),
  }),
  { virtual: true }
);

jest.mock("../../backend/repositories/UserRepository", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../../backend/repositories/UserRepository");
const AuthService = require("../../backend/services/AuthService");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    test("creates a user when email is not registered", async () => {
      const payload = {
        name: "Jane Patient",
        email: "jane@medivault.test",
        password: "Password123!",
        role: "patient",
      };

      UserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");
      UserRepository.create.mockResolvedValue({
        _id: "user-1",
        name: payload.name,
        email: payload.email,
        role: payload.role,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      const result = await AuthService.signup(payload);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(payload.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
      expect(UserRepository.create).toHaveBeenCalledWith({
        name: payload.name,
        email: payload.email,
        password: "hashed-password",
        role: payload.role,
      });
      expect(result).toEqual({
        id: "user-1",
        name: payload.name,
        email: payload.email,
        role: payload.role,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    test("throws if user already exists", async () => {
      UserRepository.findByEmail.mockResolvedValue({ _id: "existing-user" });

      await expect(
        AuthService.signup({
          name: "Existing",
          email: "existing@medivault.test",
          password: "Password123!",
          role: "patient",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "User already exists",
      });
    });
  });

  describe("login", () => {
    test("returns signed JWT and user payload for valid credentials", async () => {
      const user = {
        _id: "user-1",
        name: "Jane Patient",
        email: "jane@medivault.test",
        password: "stored-hash",
        role: "patient",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      UserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("jwt-token");

      const result = await AuthService.login({
        email: "jane@medivault.test",
        password: "Password123!",
      });

      expect(UserRepository.findByEmail).toHaveBeenCalledWith("jane@medivault.test");
      expect(bcrypt.compare).toHaveBeenCalledWith("Password123!", "stored-hash");
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "user-1", role: "patient" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      expect(result.token).toBe("jwt-token");
      expect(result.user.email).toBe("jane@medivault.test");
    });

    test("throws if user is not found", async () => {
      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.login({ email: "missing@medivault.test", password: "Password123!" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "User not found",
      });
    });

    test("throws for invalid password", async () => {
      UserRepository.findByEmail.mockResolvedValue({
        _id: "user-1",
        password: "stored-hash",
        role: "patient",
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        AuthService.login({ email: "jane@medivault.test", password: "wrong-password" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid credentials",
      });
    });
  });
});
