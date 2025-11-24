const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/mailer");
const { log } = require("console");

// --- Generate JWT Token ---
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// --- Signup Controller ---
exports.signupUser = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user (unverified)
    const user = new User({
      name,
      email,
      password,
      verified: false,
      verificationToken,
    });

    await user.save();

    // Construct verification URL
    const verifyUrl = `${process.env.BACKEND_URL}/api/verify/${verificationToken}`;

    // Send verification email
    const subject = "Verify your Blogify account ✉️";
    const html = `
      <div style="font-family:Arial;padding:20px;">
        <h2>Hello, ${name} 👋</h2>
        <p>Thanks for signing up for <b>Blogify</b>!</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" 
           style="background:#22c55e;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
           Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;

    await sendEmail(email, subject, html);

    res.status(201).json({
      status: "success",
      message:
        "Signup successful! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- Login Controller ---
exports.loginUser = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email verified
    if (!user.verified) {
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Invalid verification link" });
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    // Update verification status
    user.verified = true;
    user.verificationToken = null; // clear token
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    console.error("Email Verification Error:", err);
    res.status(500).json({
      status: "error",
      message: "Server error during verification",
    });
  }
};
