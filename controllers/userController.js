const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const cloudinary = require("../utils/cloudinary");

// ✅ Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const posts = await Post.find({ author: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ user, posts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

// ✅ Update profile (name, password, avatar)
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    let user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;

    // Handle password change
    if (password) {
      const bcrypt = require("bcrypt");
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Handle avatar upload
    if (req.file) {
      if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogify_avatars",
      });
      user.avatar = { url: result.secure_url, public_id: result.public_id };
    }

    const updatedUser = await user.save();
    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const postCount = await Post.countDocuments({ author: userId });

    const posts = await Post.find({ author: userId });
    const likeCount = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    const commentCount = await Comment.countDocuments({ author: userId });

    res.json({ postCount, likeCount, commentCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to load stats" });
  }
};
