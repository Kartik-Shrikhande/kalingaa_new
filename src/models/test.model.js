const mongoose = require("mongoose");

/* ------------------ Parameter Sub Schema ------------------ */
const testParameterSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Parameter name is required"], trim: true, maxlength: 100 },
  unit: { type: String, default: "", maxlength: 20 },
  method: { type: String, default: "", maxlength: 50 },
  analyzer: { type: String, default: "", maxlength: 50 },
  
  // ✅ NEW - Add these
  group: { type: String, default: "General" },  // "PHYSICAL EXAMINATION"
  resultType: {
    type: String,
    enum: ['numeric', 'qualitative', 'text'],
    default: 'numeric'
  },
  qualitativeOptions: [{
    value: String,
    interpretation: String
  }],
  
  referenceRanges: [{
    gender: { type: String, enum: ["Any", "Male", "Female", "Other"], default: "Any" },
    minAge: { type: Number, min: 0, default: 0 },
    maxAge: { type: Number, max: 200, default: 200 },
    rangeText: { type: String, default: "" },
    low: Number,
    high: Number,
  }],
  
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

/* ------------------ Test Schema ------------------ */
const testSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  
  category: { type: String, trim: true, default: "General" },
  department: {     // ✅ KEEP - perfect!
    type: String,
    enum: ["Hematology", "Biochemistry", "Microbiology", "Serology", "Immunology", "Radiology", "Pathology", "General"],
    default: "General",
  },
  
  testType: {
    type: String,
    enum: ["Blood", "Urine", "Imaging", "ECG", "Ultrasound", "X-Ray", "Other"],
    default: "Blood",
  },
  
  // ✅ Existing + new
  sampleType: { type: String, required: true },
  methodology: { type: String, default: "" },
  
  // ✅ NEW - Add these to Test level too
  resultType: {
    type: String,
    enum: ['numeric', 'qualitative', 'text', 'microscopy'],
    default: 'numeric'
  },
  qualitativeOptions: [{
    value: String,
    interpretation: String
  }],
  
  description: { type: String, default: "" },
  reportTime: { type: String, default: "24 hours" },
  fastingRequired: { type: Boolean, default: false },
  specimenVolume: { type: String, default: "" },
  container: { type: String, default: "" },
  storageInstructions: { type: String, default: "" },
  
  // ❌ DELETE these
  // referenceRange: mongoose.Schema.Types.Mixed,  ← DELETE
  // includesTests: [String],                      ← DELETE
  
  parameters: [testParameterSchema],
  franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise", required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

testSchema.pre("save", async function () {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `TEST${String(count + 1).padStart(4, "0")}`;
  }
});

testSchema.index({ franchiseId: 1, isActive: 1 });
testSchema.index({ department: 1 });
testSchema.index({ "parameters.name": 1, franchiseId: 1 });
testSchema.index({ "parameters.sortOrder": 1 });

module.exports = mongoose.model("Test", testSchema);


// const mongoose = require("mongoose");

// /* ------------------ Parameter Sub Schema ------------------ */

// const testParameterSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Parameter name is required"],
//       trim: true,
//       maxlength: 100,
//     },

//     unit: {
//       type: String,
//       default: "",
//       maxlength: 20,
//     },

//     method: {
//       type: String,
//       default: "",
//       maxlength: 50,
//     },

//     analyzer: {
//       type: String,
//       default: "",
//       maxlength: 50,
//     },

//     referenceRanges: [
//       {
//         gender: {
//           type: String,
//           enum: ["Any", "Male", "Female", "Other"],
//           default: "Any",
//         },

//         minAge: {
//           type: Number,
//           min: 0,
//           default: 0,
//         },

//         maxAge: {
//           type: Number,
//           max: 200,
//           default: 200,
//         },

//         rangeText: {
//           type: String,
//           default: "",
//         },

//         low: Number,
//         high: Number,
//       },
//     ],

//     sortOrder: {
//       type: Number,
//       default: 0,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// /* ------------------ Test Schema ------------------ */

// const testSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     code: {
//       type: String,
//       unique: true,
//       trim: true,
//     },

//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     /* UPDATED */
//     category: {
//       type: String,
//       trim: true,
//       default: "General",
//     },

//     /* NEW FIELD */
//     department: {
//       type: String,
//       enum: [
//         "Hematology",
//         "Biochemistry",
//         "Microbiology",
//         "Serology",
//         "Immunology",
//         "Radiology",
//         "Pathology",
//         "General",
//       ],
//       default: "General",
//     },

//     testType: {
//       type: String,
//       enum: [
//         "Blood",
//         "Urine",
//         "Imaging",
//         "ECG",
//         "Ultrasound",
//         "X-Ray",
//         "Other",
//       ],
//       default: "Blood",
//     },

//     sampleType: {
//       type: String,
//       required: true,
//     },

//     description: {
//       type: String,
//       default: "",
//     },

//     reportTime: {
//       type: String,
//       default: "24 hours",
//     },

//     fastingRequired: {
//       type: Boolean,
//       default: false,
//     },

//     specimenVolume: {
//       type: String,
//       default: "",
//     },

//     container: {
//       type: String,
//       default: "",
//     },

//     storageInstructions: {
//       type: String,
//       default: "",
//     },

//     methodology: {
//       type: String,
//       default: "",
//     },

//     referenceRange: {
//       type: mongoose.Schema.Types.Mixed,
//       default: {},
//     },

//     includesTests: [String],

//     parameters: [testParameterSchema],

//     franchiseId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Franchise",
//       required: true,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// /* ------------------ Generate Test Code ------------------ */

// testSchema.pre("save", async function () {
//   if (!this.code) {
//     const count = await this.constructor.countDocuments();
//     this.code = `TEST${String(count + 1).padStart(4, "0")}`;
//   }
// });

// /* ------------------ Indexes ------------------ */

// testSchema.index({ franchiseId: 1, isActive: 1 });
// testSchema.index({ department: 1 });
// testSchema.index({ "parameters.name": 1, franchiseId: 1 });
// testSchema.index({ "parameters.sortOrder": 1 });

// module.exports = mongoose.model("Test", testSchema);





////////////////////////////////


