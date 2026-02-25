// BACKEND/routes/buildroutes/buildProjectModel.js

import mongoose from "mongoose";

const buildProjectIntakeDB = mongoose.connection.useDb("buildProjectIntake");

const buildProjectSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authUser",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },

    // ✅ Quick fields used for listing / cards (fast UI)
    summary: {
      lotAddress: { type: String, default: "" },
      lotSizeDimensions: { type: String, default: "" },
      lotPrice: { type: Number, default: 0 },
    },

    // ✅ Tracking fields (NOT inside summary)
    currentStepType: {
      type: String,
      default: "LOT_INTAKE",
      index: true,
    },

    currentStepIndex: {
      type: Number,
      default: 0,
    },

    homeBuildIntakeStartedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // ✅ correct placement
  }
);

const BuildProject = buildProjectIntakeDB.model(
  "BuildProject",
  buildProjectSchema,
  "buildProjects"
);

export default BuildProject;