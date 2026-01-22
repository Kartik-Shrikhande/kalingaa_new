const mongoose = require("mongoose");

const franchiseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    address: {type:String},

    contactNumber: {type:String},

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Franchise", franchiseSchema);
