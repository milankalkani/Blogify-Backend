const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  verifyEmail,
} = require("../controllers/authController");

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyEmail);

module.exports = router;
