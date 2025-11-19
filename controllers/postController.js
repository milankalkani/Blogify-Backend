const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");

// --- Create a new post ---
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const post = await Post.create({
      title,
      content,
      category,
      image: image ? { url: image.url, public_id: image.public_id } : null,
      author: req.user._id,
    });

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Get all posts ---
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get All Posts Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Get single post ---
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username email"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    console.error("Get Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Update a post ---
exports.updatePost = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Allow only the author to edit
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ Handle image replacement safely
    if (image && image.url && image.public_id) {
      const isNewImage =
        !post.image ||
        (post.image.public_id && post.image.public_id !== image.public_id);

      // 🧹 Remove old image only if replaced with new one
      if (isNewImage && post.image?.public_id) {
        await cloudinary.uploader.destroy(post.image.public_id);
      }

      post.image = image;
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;

    const updatedPost = await post.save();
    res.status(200).json({ message: "Post updated", post: updatedPost });
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Delete a post ---
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // 🧹 Delete associated Cloudinary image
    if (post.image?.public_id) {
      await cloudinary.uploader.destroy(post.image.public_id);
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Like a post ---
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    post.likes.push(req.user._id);
    await post.save();

    res.status(200).json({
      message: "Post liked successfully",
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Like Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Unlike a post ---
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );

    await post.save();

    res.status(200).json({
      message: "Post unliked successfully",
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Unlike Post Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- Get logged-in user's posts ---
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Get My Posts Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
