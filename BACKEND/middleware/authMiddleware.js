// BACKEND auth middleware
import jwt from "jsonwebtoken";
import authUserModel from "../models/authmodels/auth.js";

const jsonWebTokenSecret = process.env.JWT_SECRET;

export const checkAuth = async (requestObject, responseObject, nextMiddlewareFunction) => {
  const authorizationHeaderValue = requestObject.headers.authorization;

  if (!authorizationHeaderValue) {
    return responseObject.status(401).json({
      success: false,
      message: "Unauthorized - no token - please login",
    });
  }

  const requiredBearerPrefix = "Bearer ";
  const hasBearerPrefix = authorizationHeaderValue.startsWith(requiredBearerPrefix);

  if (!hasBearerPrefix) {
    return responseObject.status(401).json({
      success: false,
      message: "Unauthorized - invalid token format - please login",
    });
  }

  const jsonWebTokenValue = authorizationHeaderValue.slice(requiredBearerPrefix.length);

  if (!jsonWebTokenValue) {
    return responseObject.status(401).json({
      success: false,
      message: "Unauthorized - no token - please login",
    });
  }

  try {
    if (!jsonWebTokenSecret) {
      console.log("checkAuth error: JWT_SECRET is missing in environment variables");
      return responseObject.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decodedTokenPayload = jwt.verify(jsonWebTokenValue, jsonWebTokenSecret);

    const authenticatedUserId = decodedTokenPayload?.userId;

    if (!authenticatedUserId) {
      return responseObject.status(401).json({
        success: false,
        message: "Unauthorized - invalid token - please login",
      });
    }

    const authenticatedUserDocument = await authUserModel.findById(authenticatedUserId);

    if (!authenticatedUserDocument) {
      return responseObject.status(401).json({
        success: false,
        message: "Unauthorized - invalid token - please login",
      });
    }

    // Keep it lean + safe
    requestObject.user = {
      userId: authenticatedUserDocument._id,
      name: authenticatedUserDocument.name,
      email: authenticatedUserDocument.email,
    };

    return nextMiddlewareFunction();
  } catch (authenticationError) {
    console.log("checkAuth error:", authenticationError?.message);

    return responseObject.status(401).json({
      success: false,
      message: "Unauthorized - invalid token - please login",
    });
  }
};