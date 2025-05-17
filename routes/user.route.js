import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
  getAllStudents,
  getAllRecruiters,
  blockStudent,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/mutler.js";

import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-reset-otp").post(verifyResetOtp);
router.route("/reset-password").post(resetPassword);
router
  .route("/profile/update")
  .post(isAuthenticated, singleUpload, updateProfile);

router.route("/allstudents").get(isAuthenticated, getAllStudents);

router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/allrecruiters", isAuthenticated, getAllRecruiters);

router.put("/block/:studentId", isAuthenticated, blockStudent);

export default router;
