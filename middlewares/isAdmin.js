import User from "../models/User.js";

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking admin status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default isAdmin;
