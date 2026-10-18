const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/UserRepository");

class AuthService {
  static async signup({ name, email, password, role }) {
    name = typeof name === 'string' ? name.trim() : '';
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    role = role || 'patient';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 6 || !['patient', 'doctor'].includes(role)) {
      throw Object.assign(new Error('Provide a name, valid email, password of at least 6 characters, and valid role'), { statusCode: 400 });
    }
    const userExists = await UserRepository.findByEmail(email);

    if (userExists) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static async login({ email, password }) {
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!email || typeof password !== 'string' || !password) throw Object.assign(new Error('Email and password are required'), { statusCode: 400 });
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 400;
      throw error;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }
}

module.exports = AuthService;
