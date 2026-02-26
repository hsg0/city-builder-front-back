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
      default: "GENERAL",
      index: true,
    },

    stepNumber: { type: Number, default: 1 },

    title: { type: String, required: true },

    status: {
      type: String,
      enum: ["planned", "in_progress", "completed"],
      default: "planned",
      index: true,
    },

    dateStart: { type: String, default: "" },
    dateEnd: { type: String, default: "" },

    costAmount: { type: Number, default: 0 },
    costCurrency: { type: String, default: "" },

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