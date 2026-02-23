// BACKEND/models/authmodels/auth.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const appUserAuthDB = mongoose.connection.useDb('appUserAuth');

const authUserSchema = new mongoose.Schema({
    userNanoId: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(6).toString('hex'),
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    accountVerificationOTP: {
        type: String,
        default: '',
    },
    accountVerificationOTPExpiry: {
        type: Date,
        default: null,
    },
    resetPasswordOTP: {
        type: String,
        default: '',
    },
    resetPasswordOTPExpiry: {
        type: Date,
        default: null,
    },
    resetPasswordDateTimeStamp: {
        type: Date,
        default: Date.now,
    },
    expoPushToken: {
        type: String,
        default: '',
    },
    accountVerificationDateTimeStamp: {
        type: Date,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true });

authUserSchema.index({ updatedAt: 1 });

const authUserModel = appUserAuthDB.model('authUser', authUserSchema, 'userauth');

export default authUserModel;