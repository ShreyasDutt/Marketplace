import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import transporter from '../db/nodemailer.js'
import {AccountVerificationMail, AccountVerifiedMail, PasswordResetMail, WelcomeMail} from "../emailTemplates.js";




export const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "Please enter all fields" });
    }

    try {
        const FoundUser = await UserModel.findOne({ email });
        if (FoundUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const CreatedUser = await UserModel.create({
            username,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: CreatedUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

        res.cookie('JWTtoken', token);

        //NODE MAILER - welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: CreatedUser.email,
            subject: `✨ You’re In! Welcome ${CreatedUser.username} to UFV Marketplace! 🎊`,
            html: `${WelcomeMail(CreatedUser.username,CreatedUser.email)}`,
        };


        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "User Registered" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please enter all fields" });
    }

    try {
        const FoundUser = await UserModel.findOne({ email });
        if (!FoundUser) {
            return res.status(400).json({ success: false, message: "Email or Password is incorrect" });
        }

        const isMatch = await bcrypt.compare(password, FoundUser.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        const token = jwt.sign({ id: FoundUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

        res.cookie('JWTtoken', token);

        return res.json({ success: true, message: "Login successful" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const logout = async (req, res) => {
    try{
        res.clearCookie('JWTtoken');
        return res.status(200).json({ success: true, message: "Logout successful" });
    }
    catch(err){
        return res.status(500).json({ success: false, error: err.message });
    }
}

export const sendverificationOTP = async (req, res) => {

    try {
        const FoundUser = await UserModel.findById(req.user);
        if (!FoundUser) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        if (FoundUser.isVerified) {
            return res.status(401).json({ success: false, message: "Already Verified" });
        }

        FoundUser.verificationOTP = String(Math.floor(100000 + Math.random() * 900000));
        FoundUser.OTPExpiration = 0;
        FoundUser.OTPExpiration = Date.now() + (15 * 60 * 1000);
        await FoundUser.save();

        //sending verification Mail
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: FoundUser.email,
            subject: `🔑 Verify Your Account, ${FoundUser.username}! Your OTP Inside`,
            html: `${AccountVerificationMail(FoundUser.username,FoundUser.email,FoundUser.verificationOTP)}`,
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Verification OTP sent" });

    } catch (err) {
        return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
};

export const verifyEmail = async (req, res) => {
    const { OTP } = req.body;
    try {
        const FoundUser = await UserModel.findById(req.user);
        if (!FoundUser) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        if (FoundUser.isVerified) {
            return res.status(401).json({ success: false, message: "Already Verified" });
        }

        if (Date.now() > FoundUser.OTPExpiration) {
            FoundUser.verificationOTP = null;
            FoundUser.OTPExpiration = null;
            await FoundUser.save();

            return res.status(401).json({ success: false, message: "OTP has expired" });
        }

        if (FoundUser.verificationOTP === String(OTP)) {
            FoundUser.isVerified = true;
            await FoundUser.save();

            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: FoundUser.email,
                subject: `Account Verified 🥳`,
                html: `${AccountVerifiedMail(FoundUser.username,FoundUser.email)}`,
            };
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ success: true, message: "Account verification successful" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

    } catch (err) {
        return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
};

export const ChangePasswordOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(401).json({ success: false, message: "Email is required" });
    }
    const FoundUser = await UserModel.findById(req.user);
    if (!FoundUser) {
        return res.status(401).json({ success: false, message: "Invalid Email Address" });
    }
    try{
        FoundUser.resetOTP = String(Math.floor(100000 + Math.random() * 900000));
        FoundUser.resetOTPExpiration = 0;
        FoundUser.resetOTPExpiration = Date.now() + (15 * 60 * 1000);
        await FoundUser.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: FoundUser.email,
            subject: `🔐 Change Your Password, ${FoundUser.username}! Your OTP Inside`,
            html: `${PasswordResetMail(FoundUser.username,FoundUser.email,FoundUser.resetOTP)}`,
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Password Reset OTP sent" });
    }catch(err){
        return res.status(401).json({ success: false, message: err.message });
    }

}

export const verifyPasswordResetOTP = async (req, res) => {
    const { OTP } = req.body;
    if (!OTP) {
        return res.status(401).json({ success: false, message: "OTP is required" });
    }
    const FoundUser = await UserModel.findById(req.user);
    if (!FoundUser) {
        return res.status(401).json({ success: false, message: "Invalid Email Address" });
    }

    if (Date.now() > FoundUser.resetOTPExpiration) {
        FoundUser.resetOTP = null;
        FoundUser.resetOTPExpiration = null;
        await FoundUser.save();
        return res.status(401).json({ success: false, message: "OTP has expired" });
    }
    try{
        if (FoundUser.resetOTP === String(OTP)) {
            return res.status(401).json({ success: true, message: "OTP matched" });
        }
        else{
            return res.status(401).json({ success: false, message: "Invalid OTP" });
        }

    }catch(err){
        return res.status(401).json({ success: false, message: err.message });
    }

}