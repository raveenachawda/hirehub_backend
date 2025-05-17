import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

export const registerCompany = async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({
        message: "Company name is required.",
        success: false,
      });
    }
    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({
        message: "You can't register same company.",
        success: false,
      });
    }
    company = await Company.create({
      name: companyName,
      userId: req.id,
    });

    return res.status(201).json({
      message: "Company registered successfully.",
      company,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getCompany = async (req, res) => {
  try {
    const userId = req.id; // logged in user id
    const companies = await Company.find();
    if (!companies) {
      return res.status(404).json({
        message: "Companies not found.",
        success: false,
      });
    }
    return res.status(200).json({
      companies,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
// get company by id
export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID.",
        success: false,
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found.",
        success: false,
      });
    }
    return res.status(200).json({
      company,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const updateCompany = async (req, res) => {
  try {
    const { name, description, website, location } = req.body;

    const file = req.file;
    // idhar cloudinary ayega
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
    const logo = cloudResponse.secure_url;

    const updateData = { name, description, website, location, logo };

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!company) {
      return res.status(404).json({
        message: "Company not found.",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Company information updated.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong.",
      success: false,
    });
  }
};

export const joinCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.id;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if user is a recruiter
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "recruiter") {
      return res.status(403).json({
        success: false,
        message: "Only recruiters can join companies",
      });
    }

    // Check if recruiter is already part of any company
    if (user.joinedCompanies && user.joinedCompanies.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are already part of a company",
      });
    }

    // Check if recruiter is already part of this company
    if (company.recruiters && company.recruiters.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already part of this company",
      });
    }

    // Create profile if it doesn't exist
    if (!user.profile) {
      const profile = await Profile.create({});
      user.profile = profile._id;
    }

    // Add recruiter to company
    if (!company.recruiters) {
      company.recruiters = [];
    }
    company.recruiters.push(userId);
    await company.save();

    // Add company to user's joinedCompanies
    user.joinedCompanies = [companyId]; // Only allow one company
    await user.save();

    res.status(200).json({
      success: true,
      message: "Successfully joined the company",
      company,
    });
  } catch (error) {
    console.error("Error in joinCompany:", error);
    res.status(500).json({
      success: false,
      message: "Error joining company",
      error: error.message,
    });
  }
};

export const getJoinedCompanies = async (req, res) => {
  try {
    const userId = req.id;

    // Get user with populated joinedCompanies
    const user = await User.findById(userId).populate({
      path: "joinedCompanies",
      select: "name description website location logo",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      companies: user.joinedCompanies || [],
    });
  } catch (error) {
    console.error("Error in getJoinedCompanies:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching joined companies",
      error: error.message,
    });
  }
};

export const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.id;

    // Get company details
    const company = await Company.findById(companyId).populate(
      "recruiters",
      "fullname email"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if user is authorized to view company details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin" && !company.recruiters.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view company details",
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Error in getCompanyDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company details",
      error: error.message,
    });
  }
};

// Add this function to get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("Error in getAllCompanies:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Delete the company
    await Company.findByIdAndDelete(companyId);

    // Remove company from all users' joinedCompanies array
    await User.updateMany(
      { joinedCompanies: companyId },
      { $pull: { joinedCompanies: companyId } }
    );

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCompany:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting company",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
