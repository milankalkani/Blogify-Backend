const Comment = require("../models/Comment");

// ➕ Add new comment (with real-time socket event)
exports.addComment = async (req, res) => {
  try {
    const { postId, content, parentComment } = req.body;

    if (!content)
      return res.status(400).json({ message: "Content is required" });

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    const populatedComment = await comment.populate("author", "name email");

    // ✅ Emit real-time event
    const io = req.app.get("io");
    io.to(postId).emit("new_comment", populatedComment);

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Add Comment Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📖 Get all comments for a post
exports.getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Fetch Comments Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✏️ Edit comment
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    comment.content = req.body.content || comment.content;
    await comment.save();

    // ✅ Emit live update event (optional)
    const io = req.app.get("io");
    io.to(comment.post.toString()).emit("update_comment", {
      _id: comment._id,
      content: comment.content,
    });

    res.status(200).json({ message: "Comment updated", comment });
  } catch (error) {
    console.error("Update Comment Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ❌ Delete comment (with socket broadcast)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    await comment.deleteOne();

    // ✅ Emit delete event
    const io = req.app.get("io");
    io.to(comment.post.toString()).emit("delete_comment", comment._id);

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete Comment Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ❤️ Like or Unlike comment (optional socket event)
exports.toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const userId = req.user._id;
    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    // ✅ Emit like/unlike update
    const io = req.app.get("io");
    io.to(comment.post.toString()).emit("update_likes", {
      commentId: comment._id,
      likesCount: comment.likes.length,
    });

    res.status(200).json({
      message: hasLiked ? "Unliked comment" : "Liked comment",
      likes: comment.likes.length,
    });
  } catch (error) {
    console.error("Toggle Like Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
