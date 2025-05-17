import Contact from "../models/Contact.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Create new contact message
    const contact = await Contact.create({
      name,
      email,
      message,
    });

    console.log("Contact message saved:", contact);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error in submitContact:", error);

    // Check for MongoDB connection error
    if (error.name === "MongoServerError") {
      return res.status(500).json({
        success: false,
        message: "Database connection error. Please try again later.",
      });
    }

    // Check for validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

export const getAllContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error in getAllContactMessages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contact messages",
      error: error.message,
    });
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { messageId, email, reply } = req.body;

    if (!messageId || !email || !reply) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Here you would typically send the email using a service like nodemailer
    // For now, we'll just return success
    // TODO: Implement actual email sending

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Contact.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};
