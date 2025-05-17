import express from "express";
import {
  submitContactForm,
  getAllContactMessages,
  replyToMessage,
  deleteMessage,
} from "../controllers/contactController.js";

import isAdmin from "../middlewares/isAdmin.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/submit", submitContactForm);
router.get(
  "/contact-messages",
  isAuthenticated,
  isAdmin,
  getAllContactMessages
);
router.post("/reply", isAuthenticated, isAdmin, replyToMessage);
router.delete("/delete/:messageId", isAuthenticated, isAdmin, deleteMessage);

export default router;
