// BACKEND auth controller
import authUserModel from '../../models/authmodels/auth.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
const sign = jwt.sign;

// Email transporter setup (Brevo / SMTP relay)
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// -------------------------------------------------------------
// ----------------------------- register -----------------------------
// -------------------------------------------------------------
export const register = async (req, res) => {
    console.log("---------- register controller ----------", req.body);

    const { email, password, name } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and password are required and must be a string',
        });
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and password must be a string',
        });
    }
    try {
        const cheakUserAlreadyExists = await authUserModel.findOne({ email });
        if (cheakUserAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email; please login',
            });
        }
        const hashTheIncomingPassword = await bcrypt.hash(password, 10);
        const createNewUser = await authUserModel.create({
            name,
            email,
            password: hashTheIncomingPassword,
        });

        const registerationWelcomeEmail = {
            from: process.env.EMAIL_FROM || 'noreply@citybuilder.com',
            to: email,
            subject: 'Welcome to City Builder',
            text: `Welcome to City Builder, ${name}! We're glad to have you on board.`,
            html: `<p>Welcome to City Builder, ${name}! We're glad to have you on board.</p>
            <p>Track every build step, share progress with clients, and sell homes — all in one place.</p>
            <p>Get started here: <a href="https://citybuilder.com">https://citybuilder.com</a></p>
            <p>If you have any questions, please contact us at <a href="mailto:support@citybuilder.com">support@citybuilder.com</a></p>
            <p>Thank you for joining City Builder!</p>
            <p>Best regards,</p>
            <p>The City Builder Team</p>`,
        };
        await emailTransporter.sendMail(registerationWelcomeEmail);

        return res.status(200).json({
            success: true,
            message: 'User has been created successfully and welcome email has been sent',
            user: {
                userId: createNewUser._id,
                name: createNewUser.name,
                email: createNewUser.email,
            },
        });
    } catch (error) {
        console.error('[register] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, registeration failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- login -----------------------------
// -------------------------------------------------------------
export const login = async (req, res) => {
    console.log("---------- login controller ----------", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required and must be a string',
        });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Email and password must be a string',
        });
    }
    try {
        const checkUserExists = await authUserModel.findOne({ email });
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this email, please register',
            });
        }
        const doPasswordsMatch = await bcrypt.compare(
            password,
            checkUserExists.password
        );
        if (!doPasswordsMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password, please try again',
            });
        }
        const signJWTTokenForUserSession = sign(
            {
                userId: checkUserExists._id,
                name: checkUserExists.name,
                email: checkUserExists.email,
            },
            JWT_SECRET,
            { expiresIn: '31 days' }
        );
        return res.status(200).json({
            success: true,
            message: 'User has been logged in successfully',
            token: signJWTTokenForUserSession,
            user: {
                userId: checkUserExists._id,
                name: checkUserExists.name,
                email: checkUserExists.email,
            },
        });
    } catch (error) {
        console.error('[login] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, login failed, please try again',
        });
    }
};

// -------------------------------------------------------------
// ----------------------------- logout -----------------------------
// -------------------------------------------------------------
export const logout = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('[logout] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, logout failed',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- send email verification OTP (15 minutes) -----------------------------
// -------------------------------------------------------------
export const sendEmailVerificationOtp = async (req, res) => {
    console.log("---------- sendEmailVerificationOtp controller ----------", req.body);
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required to verify email with OTP, please login again',
            });
        }
        const checkUserExists = await authUserModel.findById(userId);
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this ID, please register, then login again',
            });
        }
        if (checkUserExists.isEmailVerified === true) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified, no need to verify again, please re-login',
            });
        }
        const generateOTPForUser = Math.floor(100000 + Math.random() * 900000).toString();
        const generateOTPExpiryTimeStamp = Date.now() + 15 * 60 * 1000;

        checkUserExists.accountVerificationOTP = generateOTPForUser;
        checkUserExists.accountVerificationOTPExpiry = new Date(generateOTPExpiryTimeStamp);
        await checkUserExists.save();

        const emailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@citybuilder.com',
            to: checkUserExists.email,
            subject: 'City Builder - Email Verification OTP',
            text: `Your email verification OTP is: ${generateOTPForUser}`,
            html: `<p>Your email verification OTP is: <strong>${generateOTPForUser}</strong></p>
            <p>This OTP will expire in 15 minutes, please use it to verify your email.</p>
            <p>Thank you for using City Builder!</p>
            <p>Best regards,</p>
            <p>The City Builder Team</p>`,
        };
        await emailTransporter.sendMail(emailOptions);
        console.log('otp-------', generateOTPForUser);
        return res.status(200).json({
            success: true,
            message: 'New OTP has been generated and sent to the user\'s email',
        });
    } catch (error) {
        console.error('[sendEmailVerificationOtp] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, verify email with OTP failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- confirm email verification OTP -----------------------------
// -------------------------------------------------------------
export const confirmEmailVerificationOtp = async (req, res) => {
    console.log("---------- confirmEmailVerificationOtp controller ----------", req.body);
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required to verify code with OTP, please login again',
            });
        }
        const getUserOTPFromClient = req?.body?.otp;
        if (!getUserOTPFromClient) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required to verify email, please enter a valid OTP, send via email',
            });
        }
        const checkUserExists = await authUserModel.findById(userId);
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this ID, please register, then login again',
            });
        }
        if (checkUserExists.isEmailVerified === true) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified, no need to verify again, please re-login',
            });
        }
        if (!checkUserExists.accountVerificationOTP || checkUserExists.accountVerificationOTP === '') {
            return res.status(400).json({
                success: false,
                message: 'OTP is not valid, please enter a valid OTP, send via email',
            });
        }
        if (checkUserExists.accountVerificationOTP !== getUserOTPFromClient) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP, please enter a valid OTP, send via email',
            });
        }
        const expiry = checkUserExists.accountVerificationOTPExpiry;
        if (expiry && new Date(expiry).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired, please generate a new OTP, send via email',
            });
        }
        checkUserExists.isEmailVerified = true;
        checkUserExists.accountVerificationOTP = '';
        checkUserExists.accountVerificationOTPExpiry = null;
        await checkUserExists.save();
        return res.status(200).json({
            success: true,
            message: 'Email has been verified successfully, you can now login to your account',
            user: {
                userId: checkUserExists._id,
                name: checkUserExists.name,
                email: checkUserExists.email,
            },
        });
    } catch (error) {
        console.error('[confirmEmailVerificationOtp] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, verify code with OTP failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- send reset password email -----------------------------
// -------------------------------------------------------------
export const sendResetPasswordEmail = async (req, res) => {
    console.log("---------- send reset password email controller ----------", req.body);
    const email = req?.body?.email;
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required, please enter a valid email',
        });
    }
    try {
        const checkUserExists = await authUserModel.findOne({ email });
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this email, please register',
            });
        }
        const generateResetPasswordOTPForUser = Math.floor(100000 + Math.random() * 900000).toString();
        const generateResetPasswordOTPExpiryTimeStamp = Date.now() + 15 * 60 * 1000;

        checkUserExists.resetPasswordOTP = generateResetPasswordOTPForUser;
        checkUserExists.resetPasswordOTPExpiry = new Date(generateResetPasswordOTPExpiryTimeStamp);
        await checkUserExists.save();

        const resetPasswordEmailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@citybuilder.com',
            to: checkUserExists.email,
            subject: 'City Builder - Reset Password OTP',
            text: `Your reset password OTP is: ${generateResetPasswordOTPForUser}`,
            html: `<p>Your reset password OTP is: <strong>${generateResetPasswordOTPForUser}</strong></p>
            <p>This OTP will expire in 15 minutes, please use it to reset your password.</p>
            <p>Thank you for using City Builder!</p>
            <p>Best regards,</p>
            <p>The City Builder Team</p>`,
        };
        await emailTransporter.sendMail(resetPasswordEmailOptions);
        return res.status(200).json({
            success: true,
            message: 'New OTP has been generated and sent to the user\'s email',
        });
    } catch (error) {
        console.error('[sendResetPasswordEmail] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, send reset password email failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- verify reset password OTP -----------------------------
// -------------------------------------------------------------
export const verifyResetPasswordOtp = async (req, res) => {
    console.log("---------- verifyResetPasswordOtp controller ----------", req.body);
    const { email, resetPasswordOTP } = req.body;
    if (!email || !resetPasswordOTP) {
        return res.status(400).json({
            success: false,
            message: 'Email and OTP are required',
        });
    }
    if (typeof email !== 'string' || typeof resetPasswordOTP !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Email and OTP must be strings',
        });
    }
    try {
        const checkUserExists = await authUserModel.findOne({ email });
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this email, please register',
            });
        }
        if (!checkUserExists.resetPasswordOTP || checkUserExists.resetPasswordOTP === '') {
            return res.status(400).json({
                success: false,
                message: 'No reset OTP found, please request a new one',
            });
        }
        if (checkUserExists.resetPasswordOTP !== resetPasswordOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP, please enter the correct OTP sent to your email',
            });
        }
        const expiry = checkUserExists.resetPasswordOTPExpiry;
        if (expiry && new Date(expiry).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired, please request a new one',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully, you can now reset your password',
        });
    } catch (error) {
        console.error('[verifyResetPasswordOtp] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, OTP verification failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- reset password -----------------------------
// -------------------------------------------------------------
export const resetPassword = async (req, res) => {
    console.log("---------- resetPassword controller ----------", req.body);
    const { email, resetPasswordOTP, newPassword } = req.body;
    if (!email || !resetPasswordOTP || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email, OTP, and new password are required',
        });
    }
    if (typeof email !== 'string' || typeof resetPasswordOTP !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Email, OTP, and new password must be strings',
        });
    }
    try {
        const checkUserExists = await authUserModel.findOne({ email });
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this email, please register',
            });
        }
        if (!checkUserExists.resetPasswordOTP || checkUserExists.resetPasswordOTP !== resetPasswordOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP, please enter the correct OTP sent to your email',
            });
        }
        const resetExpiry = checkUserExists.resetPasswordOTPExpiry;
        if (resetExpiry && new Date(resetExpiry).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired, please request a new one',
            });
        }
        checkUserExists.password = await bcrypt.hash(newPassword, 10);
        checkUserExists.resetPasswordOTP = '';
        checkUserExists.resetPasswordOTPExpiry = null;
        checkUserExists.resetPasswordDateTimeStamp = new Date();
        await checkUserExists.save();
        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully, you can now login',
        });
    } catch (error) {
        console.error('[resetPassword] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, reset password failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- check user authentication -----------------------------
// -------------------------------------------------------------
export const isUserAuthenticated = async (req, res) => {
    console.log("---------- isUserAuthenticated controller ----------");
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required, please login again',
            });
        }
        const checkUserExists = await authUserModel
            .findById(userId)
            .select('-password');
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist, please register',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: checkUserExists,
        });
    } catch (error) {
        console.error('[isUserAuthenticated] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, authentication check failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- get user info -----------------------------
// -------------------------------------------------------------
export const getUserInfoAfterAuthentication = async (req, res) => {
    console.log("---------- getUserInfoAfterAuthentication controller ----------");
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required, please login again',
            });
        }
        const checkUserExists = await authUserModel.findById(userId).select('-password');
        if (!checkUserExists) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist, please register',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User info retrieved successfully',
            user: checkUserExists,
        });
    } catch (error) {
        console.error('[getUserInfoAfterAuthentication] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error, get user info failed, please try again',
        });
    }
};


// -------------------------------------------------------------
// ----------------------------- save expo push token -----------------------------
// -------------------------------------------------------------
export const saveExpoPushToken = async (req, res) => {
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { expoPushToken } = req.body || {};
        if (!expoPushToken || typeof expoPushToken !== 'string' || expoPushToken.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Expo push token is required' });
        }
        const updatedUser = await authUserModel.findByIdAndUpdate(
            userId,
            { expoPushToken: expoPushToken.trim() },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'Expo push token saved',
        });
    } catch (error) {
        console.error('[saveExpoPushToken] Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


// -------------------------------------------------------------
// ----------------------------- remove expo push token -----------------------------
// -------------------------------------------------------------
export const removeExpoPushToken = async (req, res) => {
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const updatedUser = await authUserModel.findByIdAndUpdate(
            userId,
            { expoPushToken: '' },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'Expo push token removed',
        });
    } catch (error) {
        console.error('[removeExpoPushToken] Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};