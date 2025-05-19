import express from "express";
import {
  getRecruiterDetails,
  getDashboardStats,
  register,
  login,
  logout,
  updateProfile,
  sendOtp,
  verifyOtp,
  resendOtp,
  getAllStudents,
  getAllRecruiters,
  blockStudent,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Profile routes
router.put("/update-profile", isAuthenticated, updateProfile);

// OTP routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// Admin routes
router.get("/dashboard-stats", isAuthenticated, isAdmin, getDashboardStats);
router.get("/students", isAuthenticated, isAdmin, getAllStudents);
router.get("/recruiters", isAuthenticated, isAdmin, getAllRecruiters);
router.put("/block-student/:studentId", isAuthenticated, isAdmin, blockStudent);

// Recruiter routes
router.get("/recruiter/:recruiterId", isAuthenticated, getRecruiterDetails);

export default router;
