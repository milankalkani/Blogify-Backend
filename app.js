require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const verifyRoutes = require("./routes/verify");
const uploadRoutes = require("./routes/upload");
const usersRoutes = require("./routes/user");

const app = express();

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// --- Middleware Setup ---
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  cors({
    origin: "https://blogify-backend-156q.onrender.com/api",
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- API Routes ---
app.get("/api", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Blogify API Running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
