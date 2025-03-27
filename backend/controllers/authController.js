import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
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
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: CreatedUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

        res.cookie('JWTtoken', token, { maxAge: 7 * 24 * 60 * 60 * 1000});

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
        const FoundUser = await userModel.findOne({ email });
        if (!FoundUser) {
            return res.status(400).json({ success: false, message: "Email or Password is incorrect" });
        }

        const isMatch = await bcrypt.compare(password, FoundUser.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        const token = jwt.sign({ id: FoundUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

        res.cookie('JWTtoken', token, { maxAge: 7 * 24 * 60 * 60 * 1000 });

        return res.json({ success: true, message: "Login successful" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const logout = async (req, res) => {
    try{
        res.clearCookie('JWTtoken',{ maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({ success: true, message: "Logout successful" });
    }
    catch(err){
        return res.status(500).json({ success: false, error: err.message });
    }
}