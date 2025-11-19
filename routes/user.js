const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
  getStats,
} = require("../controllers/userController");

const upload = multer({ dest: "uploads/" });
router.get("/me", protect, getUserProfile);
router.put("/update", protect, upload.single("avatar"), updateUserProfile);
router.get("/stats", protect, getStats);

module.exports = router;
