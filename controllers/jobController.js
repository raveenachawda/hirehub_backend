// Add this function to get recruiter details
export const getRecruiterDetails = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const recruiter = await User.findById(recruiterId).select("fullname email");

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    res.status(200).json({
      success: true,
      recruiter,
    });
  } catch (error) {
    console.error("Error fetching recruiter details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recruiter details",
    });
  }
};
