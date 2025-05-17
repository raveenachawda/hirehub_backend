import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import Otp from "../models/otp.model.js";
import Profile from "../models/Profile.js";

import { sendEmail } from "../utils/sendEmail.js";

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }
    const file = req.file;
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    }
    // const hashedPassword = await bcryptjs.hash(password, 10);

    // Create profile first
    const profile = await Profile.create({
      profilePhoto: cloudResponse.secure_url,
    });

    // Create user with profile reference
    await User.create({
      fullname,
      email,
      phoneNumber,
      password,
      role,
      profile: profile._id,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error creating account",
      success: false,
      error: error.message,
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and populate profile
    const user = await User.findOne({ email }).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("Environment variables:", {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not Set",
        PORT: process.env.PORT,
        MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not Set",
      });
      throw new Error(
        "JWT_SECRET is not configured. Please check your .env file."
      );
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
      domain:
        process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
    });

    // Send response with populated profile
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        profile: user.profile,
        joinedCompanies: user.joinedCompanies,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const file = req.file;
    const userId = req.id; // middleware authentication

    // Find user and populate profile
    let user = await User.findById(userId).populate("profile");
    if (!user) {
      return res.status(400).json({
        message: "User not found.",
        success: false,
      });
    }

    // Update user fields
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Handle file upload if present
    let cloudResponse;
    if (file) {
      const fileUri = getDataUri(file);
      cloudResponse = await cloudinary.uploader.upload(fileUri.content);
    }

    // Update profile fields
    if (user.profile) {
      if (bio) user.profile.bio = bio;
      if (skills) {
        const skillsArray = skills.split(",");
        user.profile.skills = skillsArray;
      }
      if (cloudResponse) {
        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = file.originalname;
      }
      await user.profile.save();
    }

    await user.save();

    // Fetch updated user with populated profile
    user = await User.findById(userId).populate("profile");

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile: user.profile,
        isVerified: user.isVerified,
        status: user.status,
        joinedCompanies: user.joinedCompanies,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({
      message: "Something went wrong.",
      success: false,
      error: error.message,
    });
  }
};
export const sendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Input validation
    if (!email?.trim() || !role?.trim()) {
      return res.status(400).json({
        message: "Email and role are required",
        success: false,
      });
    }

    const cleanEmail = email.trim();
    const cleanRole = role.trim();

    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Role verification
    if (user.role !== cleanRole) {
      return res.status(400).json({
        message: "Role doesn't match",
        success: false,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to Otp model
    const newOtp = new Otp({
      email: cleanEmail,
      otp: otp,
      createdAt: new Date(),
    });
    await newOtp.save();

    // Also update user record (optional - if you still want to store there)
    await User.updateOne({ _id: user._id }, { $set: { otp, otpExpiry } });

    // Send email
    const emailSent = await sendEmail(
      cleanEmail,
      "Your Verification Code",
      `Your OTP is ${otp}`,
      `<div>Your verification code is <strong>${otp}</strong></div>`
    );

    if (!emailSent) {
      throw new Error("Failed to send OTP email");
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      message: "Failed to send OTP",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      });
    }

    // Check OTP in Otp model first
    const otpRecord = await Otp.findOne({
      email: email.trim(),
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP",
        success: false,
      });
    }

    // Find user
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("Environment variables:", {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not Set",
        PORT: process.env.PORT,
        MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not Set",
      });
      throw new Error(
        "JWT_SECRET is not configured. Please check your .env file."
      );
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      })
      .json({
        message: "Email verified successfully",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        success: true,
      });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Update user with new OTP
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email with new OTP
    const emailSent = await sendEmail(
      email,
      "Your New Verification OTP",
      `Your new OTP is ${otp}`,
      `<div>
        <h2>Email Verification</h2>
        <p>Your new OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>`
    );

    if (!emailSent) {
      return res.status(500).json({
        message: "Failed to resend OTP email",
        success: false,
      });
    }

    return res.status(200).json({
      message: "OTP resent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .populate("profile", "profilePhoto bio university")
      .sort({ createdAt: -1 });

    // Transform the data to include the correct field names and status
    const formattedStudents = students.map((student) => ({
      _id: student._id,
      fullname: student.fullname, // Changed from name to fullname
      email: student.email,
      university: student.profile?.university || "Not specified",
      status: student.status,
      createdAt: student.createdAt,
    }));

    return res.status(200).json({
      success: true,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
};
export const getAllRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({ role: "recruiter" })
      .select("-password")
      .populate("profile", "profilePhoto bio company")
      .sort({ createdAt: -1 });

    // Transform the data to include the correct field names and status
    const formattedRecruiters = recruiters.map((recruiter) => ({
      _id: recruiter._id,
      fullname: recruiter.fullname,
      email: recruiter.email,
      company: recruiter.profile?.company || "Not specified",
      status: recruiter.status,
      createdAt: recruiter.createdAt,
    }));

    return res.status(200).json({
      success: true,
      recruiters: formattedRecruiters,
    });
  } catch (error) {
    console.error("Error in getAllRecruiters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching recruiters",
      error: error.message,
    });
  }
};
export const blockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    student.status = student.status === "blocked" ? "verified" : "blocked";
    await student.save();
    res.status(200).json({
      success: true,
      message: "Student status updated",
      status: student.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to Otp model
    const newOtp = new Otp({
      email: email.trim(),
      otp: otp,
      createdAt: new Date(),
    });
    await newOtp.save();

    // Send email
    const emailSent = await sendEmail(
      email.trim(),
      "Password Reset OTP",
      `Your OTP for password reset is ${otp}`,
      `<div>Your OTP for password reset is <strong>${otp}</strong></div>`
    );

    if (!emailSent) {
      throw new Error("Failed to send OTP email");
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      message: "Failed to process forgot password request",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      });
    }

    // Check OTP in Otp model
    const otpRecord = await Otp.findOne({
      email: email.trim(),
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP",
        success: false,
      });
    }

    // Check if OTP is expired (10 minutes)
    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "OTP has expired",
        success: false,
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({
      message: "Failed to verify OTP",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp?.trim() || !newPassword?.trim()) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
        success: false,
      });
    }

    // Verify OTP again before resetting password
    const otpRecord = await Otp.findOne({
      email: email.trim(),
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP",
        success: false,
      });
    }

    // Check if OTP is expired
    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "OTP has expired",
        success: false,
      });
    }

    // Find user and update password
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Update password
    user.password = newPassword.trim();
    await user.save();

    // Delete the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      message: "Failed to reset password",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
