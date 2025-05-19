import express from "express";

import { getAdminJobs, getAllJobs, getJobById, postJob, deleteJob, getCompanyJobs } from "../controllers/job.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(getAllJobs);
router.route("/getall").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.delete('/delete/:jobId', isAuthenticated, deleteJob);
// router.get("/recruiter/:recruiterId", getRecruiterDetails);
router.get("/company/:companyId", getCompanyJobs);

export default router;