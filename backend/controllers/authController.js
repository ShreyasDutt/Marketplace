import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import transporter from '../db/nodemailer.js'


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
            subject:`✨ You’re In! Welcome ${CreatedUser.username} to UFV Marketplace! 🎊`,
            text: `Your account has been successfully registered on UFV Marketplace! 🎊
                📧 Email ID: ${CreatedUser.email},
                Start buying, selling, and exploring great deals now!`
        }

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