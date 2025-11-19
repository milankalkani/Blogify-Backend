const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary");
const { protect } = require("../middleware/authMiddleware");

// ✅ Multer setup (temporary local storage)
const upload = multer({ dest: "uploads/" });

// ==================== UPLOAD IMAGE ====================
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
        url: "",
        public_id: "",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blogify_posts",
      resource_type: "image",
      transformation: [
        { width: 800, crop: "scale" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    // Delete local temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Image upload failed",
      url: "",
      public_id: "",
      error: error.message,
    });
  }
});

// ==================== DELETE IMAGE ====================
router.delete("/delete", protect, async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }

    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok") {
      return res.status(400).json({ message: "Failed to delete image" });
    }

    res.status(200).json({
      message: "Image deleted successfully",
      public_id,
    });
  } catch (error) {
    console.error("❌ Cloudinary Delete Error:", error);
    res.status(500).json({
      message: "Failed to delete image",
      error: error.message,
    });
  }
});

module.exports = router;
