const bcrypt = require("bcrypt");
const { User } = require("../models");
const JwtUtil = require("../utils/jwtUtil.js"); // Adjust the path as necessary

class UserController {
  // Add a new user (Registration)
  async addUser(req, res) {
    try {
      const { firstName, lastName, email, password, confirmPassword } =
        req.body;

      // Validate that password and confirmPassword are the same
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Passwords do not match" });
      }

      // Check if the email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already registered" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = JwtUtil.generateToken(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        "1h" // 1 hour expiration
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: newUser,
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error registering user",
        error: error.message,
      });
    }
  }

  // Login user
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      // Check if the user exists
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid email or password" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = JwtUtil.generateToken(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        "1h" // 1 hour expiration
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        user,
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  }

  // Get a user by ID
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }

  // Edit a user's details
  async editUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Update user details
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email,
      });

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }

  // Handle forget password
  async forgetPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Generate JWT reset token
      const resetToken = JwtUtil.generateToken(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        "1h" // 1 hour expiration
      );

      // Save the token (or send it via email, depending on your flow)
      // For Sequelize, you would add resetToken and resetTokenExpire fields to the User model
      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpire: new Date(Date.now() + 3600000), // 1 hour from now
      });

      // Send the token to the user's email (assuming you have a mailer service)
      // await sendResetEmail(user.email, resetToken);

      res.status(200).json({
        success: true,
        message: "Password reset token sent to email",
        resetToken,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error in forget password",
        error: error.message,
      });
    }
  }

  // Change user password
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate that newPassword and confirmPassword are the same
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "New passwords do not match" });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
      }

      // Hash new password and update
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
      await user.update({ password: hashedNewPassword });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error changing password",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
