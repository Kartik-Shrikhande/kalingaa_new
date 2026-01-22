const mongoose = require("mongoose");

const franchiseAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    mobile: {
      type: String
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: "FranchiseAdmin"
    },

    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FranchiseAdmin", franchiseAdminSchema);
