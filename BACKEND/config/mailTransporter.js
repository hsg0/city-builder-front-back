// mail transporter configuration
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const cityBuilderEmailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export default cityBuilderEmailTransporter;
    