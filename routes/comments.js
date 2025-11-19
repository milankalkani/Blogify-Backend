const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLike,
} = require("../controllers/commentController");

// Public
router.get("/:postId", getCommentsByPost);

// Protected
router.post("/", protect, addComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);
router.put("/:id/like", protect, toggleLike);

module.exports = router;
