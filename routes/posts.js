// backend/routes/posts.js

const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getMyPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

router.get("/mine", protect, getMyPosts);

router.get("/", getAllPosts);
router.get("/:id", getPostById);

router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);

module.exports = router;
