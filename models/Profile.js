import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    bio: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
      },
    ],
    resume: {
      type: String,
      default: "",
    },
    resumeOriginalName: {
      type: String,
      default: "",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
