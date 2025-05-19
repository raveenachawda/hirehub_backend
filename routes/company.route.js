import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getCompany,
  getCompanyById,
  registerCompany,
  updateCompany,
  joinCompany,
  getJoinedCompanies,
  getCompanyDetails,
  getAllCompanies,
  deleteCompany,
  leaveCompany,
} from "../controllers/company.controller.js";
import { singleUpload } from "../middlewares/mutler.js";

const router = express.Router();

// Company registration and management routes
router.route("/register").post(isAuthenticated, registerCompany);
router.route("/get").get(isAuthenticated, getCompany);
router.route("/get/:id").get(isAuthenticated, getCompanyById);
router.route("/update/:id").put(isAuthenticated, singleUpload, updateCompany);
router.route("/join/:id").post(isAuthenticated, joinCompany);
router.route("/leave/:id").post(isAuthenticated, leaveCompany);
router.route("/joined").get(isAuthenticated, getJoinedCompanies);
router.route("/details/:id").get(isAuthenticated, getCompanyDetails);
router.route("/all").get(isAuthenticated, getAllCompanies);
router.route("/delete/:id").delete(isAuthenticated, deleteCompany);

export default router;
