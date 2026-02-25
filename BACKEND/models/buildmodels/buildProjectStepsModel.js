// BACKEND/routes/buildroutes/buildStepModel.js

import mongoose from "mongoose";

const buildProjectIntakeDB = mongoose.connection.useDb("buildProjectIntake");

const buildStepSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuildProject",
      required: true,
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authUser",
      required: true,
      index: true,
    },

    stepType: {
      type: String,
      required: true,
      index: true, // helpful for filtering
      // enum optional: ["LOT_INTAKE","DEMOLITION","FOUNDATION","FRAMING"]
    },

    title: { type: String, default: "" },

    status: {
      type: String,
      enum: ["planned", "in_progress", "completed"],
      default: "planned",
      index: true,
    },

    dateStart: { type: Date, default: null },
    dateEnd: { type: Date, default: null },

    costAmount: { type: Number, default: 0 },
    costCurrency: { type: String, default: "CAD" },

    notes: { type: String, default: "" },

    photos: [
      {
        imageKitFileId: { type: String, default: "" },
        url: { type: String, default: "" },
        thumbnailUrl: { type: String, default: "" },
        name: { type: String, default: "" },
        expiresAt: { type: Date, default: null }, // store + regenerate later if needed
      },
    ],

    // ✅ Flexible step-specific payload
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Optional audit/revision support
    revisionNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// ✅ Common useful indexes
buildStepSchema.index({ projectId: 1, createdAt: 1 });
buildStepSchema.index({ projectId: 1, stepType: 1 });
buildStepSchema.index({ ownerUserId: 1, status: 1 });

const BuildStep = buildProjectIntakeDB.model("BuildStep", buildStepSchema, "buildSteps");

export default BuildStep;