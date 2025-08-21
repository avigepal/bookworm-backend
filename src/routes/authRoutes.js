import express from "express";
import User from "../models/User.js"; // Assuming you have a User model defined
import jwt from "jsonwebtoken"; // For token generation

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "15d" } // Token expiration time
  );
};

router.post("/register", async (req, res) => {
  // Handle registration logic here
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }
    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    // random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    // Create new user
    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
        token,
        user:{
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
        message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  // Handle login logic here
  try{
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.status(200).json({
        token,
        user:{
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
        message: "Login successful",
    });
  }catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
