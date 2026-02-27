// // BACKEND/controllers/buildControllers/newBuildIntake.js

import BuildProject from "../../models/buildmodels/buildProjectModel.js";
import BuildStep from "../../models/buildmodels/buildProjectStepsModel.js";

import cityBuilderEmailTransporter from "../../config/mailTransporter.js";

export {
  getBuildById,
  getBuildStepsByProjectId,
  addBuildStepToProject,
  updateBuildStepByStepId,
  uploadPhotosToBuildStepByStepId,
} from "./buildSteps.js";

const MAXIMUM_LOT_PHOTOS_ALLOWED = 8;

function createThirtyYearExpiryDate() {
  const expiryDateValue = new Date();
  expiryDateValue.setFullYear(expiryDateValue.getFullYear() + 30);
  return expiryDateValue;
}

function normalizePhotoArrayForMongo(photoArrayValue) {
  const safePhotoArray = Array.isArray(photoArrayValue) ? photoArrayValue : [];

  const trimmedPhotoArray = safePhotoArray.slice(0, MAXIMUM_LOT_PHOTOS_ALLOWED);

  return trimmedPhotoArray
    .map((photoObject) => ({
      imageKitFileId: String(photoObject?.imageKitFileId || "").trim(),
      url: String(photoObject?.url || "").trim(),
      thumbnailUrl: String(photoObject?.thumbnailUrl || "").trim(),
      name: String(photoObject?.name || "").trim(),
      expiresAt: createThirtyYearExpiryDate(),
    }))
    .filter((photoObject) => photoObject.imageKitFileId && photoObject.url);
}

function buildProjectStartedEmailHtml({
  recipientNameStringValue,
  buildProjectIdStringValue,
  lotAddressStringValue,
  lotSizeDimensionsStringValue,
  lotPriceStringValue,
  lotTerrainTypeStringValue,
  hasOldHouseToDemolishBooleanValue,
  buildCreatedAtDateStringValue,
  lotPhotoUrlList,
  contactEmailStringValue,
}) {
  const safeRecipientName = recipientNameStringValue || "there";
  const safeLotAddress = lotAddressStringValue || "your lot";
  const safeLotSize = lotSizeDimensionsStringValue || "N/A";
  const safeLotPrice = lotPriceStringValue || "N/A";
  const safeTerrain = lotTerrainTypeStringValue || "flat";
  const safeDemolition = hasOldHouseToDemolishBooleanValue ? "Yes — needs demolition" : "No — empty lot";
  const safeDate = buildCreatedAtDateStringValue || new Date().toLocaleString();
  const safeContactEmail = contactEmailStringValue || "support@citybuilder.com";

  // Build photo thumbnails as clickable images (or simple links as fallback)
  const safePhotoItems = (lotPhotoUrlList || [])
    .map(
      (url, index) =>
        `<td style="padding:4px;text-align:center;">
          <a href="${url}" target="_blank" rel="noreferrer">
            <img src="${url}" alt="Lot photo ${index + 1}" width="120" height="90" style="border-radius:8px;object-fit:cover;border:1px solid #ddd;" />
          </a>
        </td>`
    )
    .join("");

  const photosSection =
    lotPhotoUrlList && lotPhotoUrlList.length > 0
      ? `<h3 style="margin:18px 0 8px;color:#333;">📸 Lot Photos (${lotPhotoUrlList.length})</h3>
         <table cellpadding="0" cellspacing="0" style="margin:0;"><tr>${safePhotoItems}</tr></table>
         <p style="margin:6px 0 0;color:#888;font-size:11px;">Tap any photo to view full size.</p>`
      : `<p style="margin:12px 0;color:#888;">No lot photos were uploaded.</p>`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222; max-width: 600px;">
      <h2 style="margin:0 0 14px; color:#1a1a1a;">City Builder — New Build Started ✅</h2>

      <p style="margin:0 0 12px;">Hi ${safeRecipientName},</p>
      <p style="margin:0 0 16px;">
        Your build project has been created and saved as <b style="color:#16a34a;">Active</b>.
        Here are the details:
      </p>

      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:16px;">
        <tr style="background:#f7f7f7;">
          <td style="font-weight:700;width:180px;border:1px solid #e5e5e5;">Build Project ID</td>
          <td style="border:1px solid #e5e5e5;font-family:monospace;font-size:13px;">${buildProjectIdStringValue}</td>
        </tr>
        <tr>
          <td style="font-weight:700;border:1px solid #e5e5e5;">Date &amp; Time</td>
          <td style="border:1px solid #e5e5e5;">${safeDate}</td>
        </tr>
        <tr style="background:#f7f7f7;">
          <td style="font-weight:700;border:1px solid #e5e5e5;">Lot Address</td>
          <td style="border:1px solid #e5e5e5;">${safeLotAddress}</td>
        </tr>
        <tr>
          <td style="font-weight:700;border:1px solid #e5e5e5;">Lot Size / Dimensions</td>
          <td style="border:1px solid #e5e5e5;">${safeLotSize}</td>
        </tr>
        <tr style="background:#f7f7f7;">
          <td style="font-weight:700;border:1px solid #e5e5e5;">Lot Price</td>
          <td style="border:1px solid #e5e5e5;">$${safeLotPrice}</td>
        </tr>
        <tr>
          <td style="font-weight:700;border:1px solid #e5e5e5;">Terrain</td>
          <td style="border:1px solid #e5e5e5;text-transform:capitalize;">${safeTerrain}</td>
        </tr>
        <tr style="background:#f7f7f7;">
          <td style="font-weight:700;border:1px solid #e5e5e5;">Old House on Lot?</td>
          <td style="border:1px solid #e5e5e5;">${safeDemolition}</td>
        </tr>
      </table>

      ${photosSection}

      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 16px;" />

      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#333;">
        Thanks from City Builder 🏗️
      </p>
      <p style="margin:0 0 16px;color:#555;font-size:13px;">
        You can always view your build details inside the app.
        This email is just a receipt for your records.
      </p>

      <p style="margin:0;color:#888;font-size:12px;">
        Any concerns? Write to us at
        <a href="mailto:${safeContactEmail}" style="color:#2563eb;">${safeContactEmail}</a>
      </p>
    </div>
  `;
}

async function trySendBuildStartedEmail({
  recipientEmailAddressStringValue,
  recipientNameStringValue,
  buildProjectIdStringValue,
  lotAddressStringValue,
  lotSizeDimensionsStringValue,
  lotPriceStringValue,
  lotTerrainTypeStringValue,
  hasOldHouseToDemolishBooleanValue,
  buildCreatedAtDateStringValue,
  lotPhotoUrlList,
}) {
  try {
    if (!recipientEmailAddressStringValue) {
      console.log("trySendBuildStartedEmail => no recipient email, skipping");
      return;
    }

    const fromEmailAddressStringValue =
      process.env.EMAIL_FROM || "City Builder <no-reply@citybuilder.com>";

    // Contact email shown in the footer — same as FROM or a dedicated support address
    const contactEmailStringValue = process.env.EMAIL_FROM || "support@citybuilder.com";

    const emailSubjectStringValue = "City Builder — Your new build has started ✅";

    const emailHtmlBodyStringValue = buildProjectStartedEmailHtml({
      recipientNameStringValue,
      buildProjectIdStringValue,
      lotAddressStringValue,
      lotSizeDimensionsStringValue,
      lotPriceStringValue,
      lotTerrainTypeStringValue,
      hasOldHouseToDemolishBooleanValue,
      buildCreatedAtDateStringValue,
      lotPhotoUrlList,
      contactEmailStringValue,
    });

    await cityBuilderEmailTransporter.sendMail({
      from: fromEmailAddressStringValue,
      to: recipientEmailAddressStringValue,
      subject: emailSubjectStringValue,
      html: emailHtmlBodyStringValue,
    });

    console.log("trySendBuildStartedEmail => email sent to:", recipientEmailAddressStringValue);
  } catch (emailError) {
    // ✅ Do NOT fail the request if email fails
    console.log("trySendBuildStartedEmail error:", emailError?.message || emailError);
  }
}
//-----------------------------------------------------------------------
/**
 * POST /api/builds/create  (depending on your router path)
 *
 * Body:
 * - metadata: { lotAddress, lotSizeDimensions, lotPrice, lotTerrainType, hasOldHouseToDemolish }
 * - photos: [{ imageKitFileId, url, thumbnailUrl, name }]
 */
export async function createNewBuild(requestObject, responseObject) {
  try {
    const authenticatedUserId = requestObject.user?.userId;
    const authenticatedUserEmailAddress = requestObject.user?.email;
    const authenticatedUserName = requestObject.user?.name;

    const metadataObject = requestObject.body?.metadata || {};
    const photoArrayFromClient = requestObject.body?.photos || [];

    const lotAddressStringValue = String(metadataObject.lotAddress || "").trim();
    const lotSizeDimensionsStringValue = String(metadataObject.lotSizeDimensions || "").trim();

    const lotPriceNumberValue = Number(metadataObject.lotPrice);
    const isLotPriceValid = !Number.isNaN(lotPriceNumberValue) && lotPriceNumberValue > 0;

    const lotTerrainTypeStringValue = String(metadataObject.lotTerrainType || "flat").trim();
    const hasOldHouseToDemolishBooleanValue = Boolean(metadataObject.hasOldHouseToDemolish);

    if (!lotAddressStringValue) {
      return responseObject.status(400).json({ success: false, message: "lotAddress is required" });
    }

    if (!lotSizeDimensionsStringValue) {
      return responseObject.status(400).json({ success: false, message: "lotSizeDimensions is required" });
    }

    if (!isLotPriceValid) {
      return responseObject.status(400).json({ success: false, message: "lotPrice must be a valid number" });
    }

    const normalizedLotPhotosArray = normalizePhotoArrayForMongo(photoArrayFromClient);

    // 1) Create BuildProject
    const createdBuildProjectDocument = await BuildProject.create({
      ownerUserId: authenticatedUserId,
      status: "active",
      summary: {
        lotAddress: lotAddressStringValue,
        lotSizeDimensions: lotSizeDimensionsStringValue,
        lotPrice: lotPriceNumberValue,
      },
      currentStepType: "LOT_INTAKE",
      currentStepIndex: 0,
      homeBuildIntakeStartedAt: new Date(),
    });

    // 2) Create LOT_INTAKE step with photos + data
    const createdLotIntakeStepDocument = await BuildStep.create({
      projectId: createdBuildProjectDocument._id,
      ownerUserId: authenticatedUserId,
      stepType: "LOT_INTAKE",
      title: "Lot Intake",
      status: "in_progress",
      data: {
        lotTerrainType: lotTerrainTypeStringValue,
        hasOldHouseToDemolish: hasOldHouseToDemolishBooleanValue,
      },
      photos: normalizedLotPhotosArray,
      revisionNumber: 1,
    });

    // ✅ 3) Send email confirmation (non-blocking for success)
    const lotPhotoUrlList = normalizedLotPhotosArray.map((photo) => photo.url);

    // Format the created date/time for a human-readable email
    const buildCreatedAtDateStringValue = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Format lot price with commas for readability (e.g. 3000000 → "3,000,000")
    const formattedLotPriceStringValue = lotPriceNumberValue.toLocaleString("en-US");

    // Send after successful DB writes
    await trySendBuildStartedEmail({
      recipientEmailAddressStringValue: authenticatedUserEmailAddress,
      recipientNameStringValue: authenticatedUserName,
      buildProjectIdStringValue: String(createdBuildProjectDocument._id),
      lotAddressStringValue,
      lotSizeDimensionsStringValue,
      lotPriceStringValue: formattedLotPriceStringValue,
      lotTerrainTypeStringValue,
      hasOldHouseToDemolishBooleanValue,
      buildCreatedAtDateStringValue,
      lotPhotoUrlList,
    });

    return responseObject.status(201).json({
      success: true,
      message: "Build created",
      project: createdBuildProjectDocument,
      firstStep: createdLotIntakeStepDocument,
    });
  } catch (error) {
    console.log("createNewBuild error:", error);
    return responseObject.status(500).json({ success: false, message: "Server error" });
  }
}

//------------------------------------------------------------------------------
/**
 * GET /api/builds/active
 *
 * Returns every active BuildProject for the authenticated user.
 * For each project we also fetch the LOT_INTAKE step and attach its
 * photo URLs so the frontend can render hero images in a single call
 * (no N+1 per-build step fetches required).
 *
 * Response shape per build:
 *   { ...BuildProject fields, lotPhotos: [ { url, thumbnailUrl, name } ] }
 */
export async function getActiveBuilds(requestObject, responseObject) {
  try {
    const authenticatedUserId = requestObject.user?.userId;

    // 1) Fetch all active projects for this user
    const activeBuildProjectsArray = await BuildProject.find({
      ownerUserId: authenticatedUserId,
      status: "active",
    })
      .sort({ updatedAt: -1 })
      .lean();

    // 2) Collect all project IDs so we can bulk-fetch LOT_INTAKE steps
    const projectIdList = activeBuildProjectsArray.map(
      (buildProjectObject) => buildProjectObject._id
    );

    // 3) One query: get the LOT_INTAKE step for every active project
    const lotIntakeStepsArray = await BuildStep.find({
      projectId: { $in: projectIdList },
      stepType: "LOT_INTAKE",
    })
      .select("projectId photos")
      .lean();

    // 4) Build a lookup map:  projectId → photo array
    const projectIdToLotPhotosMap = {};
    for (const stepDocument of lotIntakeStepsArray) {
      const projectIdStringValue = String(stepDocument.projectId);
      const safePhotosArray = Array.isArray(stepDocument.photos)
        ? stepDocument.photos
        : [];

      // Only send the fields the frontend actually needs
      projectIdToLotPhotosMap[projectIdStringValue] = safePhotosArray.map(
        (photoObject) => ({
          url: photoObject.url || "",
          thumbnailUrl: photoObject.thumbnailUrl || "",
          name: photoObject.name || "",
        })
      );
    }

    // 5) Attach lotPhotos to each build before sending the response
    const buildsWithPhotosArray = activeBuildProjectsArray.map(
      (buildProjectObject) => ({
        ...buildProjectObject,
        lotPhotos:
          projectIdToLotPhotosMap[String(buildProjectObject._id)] || [],
      })
    );

    return responseObject.status(200).json({
      success: true,
      builds: buildsWithPhotosArray,
    });
  } catch (error) {
    console.log("getActiveBuilds error:", error);
    return responseObject.status(500).json({ success: false, message: "Server error" });
  }
}

//------------------------------------------------------------------------------
/**
 * PATCH /api/builds/:projectId/complete
 *
 * Marks an active BuildProject as "completed".
 * - Verifies the authenticated user owns the project.
 * - Sets status → "completed" via findOneAndUpdate.
 * - Returns the updated build document.
 */
export async function markBuildComplete(requestObject, responseObject) {
  try {
    const authenticatedUserId = requestObject.user?.userId;
    const projectIdParam = requestObject.params?.projectId;

    if (!projectIdParam) {
      return responseObject
        .status(400)
        .json({ success: false, message: "projectId is required" });
    }

    console.log(
      "[markBuildComplete] userId:",
      authenticatedUserId,
      "projectId:",
      projectIdParam
    );

    // Atomic find + update — only if the caller owns it AND it's currently active
    const updatedBuildDocument = await BuildProject.findOneAndUpdate(
      {
        _id: projectIdParam,
        ownerUserId: authenticatedUserId,
        status: "active",
      },
      { $set: { status: "completed" } },
      { new: true }
    );

    if (!updatedBuildDocument) {
      return responseObject.status(404).json({
        success: false,
        message:
          "Build not found, not owned by you, or already completed/archived.",
      });
    }

    console.log(
      "[markBuildComplete] ✅ Build marked complete:",
      updatedBuildDocument._id
    );

    return responseObject.status(200).json({
      success: true,
      message: "Build marked as completed.",
      build: updatedBuildDocument,
    });
  } catch (error) {
    console.log("markBuildComplete error:", error);
    return responseObject
      .status(500)
      .json({ success: false, message: "Server error" });
  }
}