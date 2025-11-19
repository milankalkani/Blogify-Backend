const User = require("../models/User");

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px;">
        <h2>Email Verified ✅</h2>
        <p>Your email has been successfully verified. You can now log in.</p>
        <a href="${process.env.FRONTEND_URL}"><button>Go to Homepage</button></a>
      </div>
    `);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
