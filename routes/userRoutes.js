import express from "express";
import {
  getRecruiterDetails,
  // ... other controller functions
} from "../controllers/userController.js";

const router = express.Router();

// Recruiter routes
router.get("/recruiter/:recruiterId", getRecruiterDetails);

export default router;
