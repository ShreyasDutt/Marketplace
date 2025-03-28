import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config();

const LoggedIn = async (req,res,next) =>{
    const token = req.cookies.JWTtoken;
    if (!token) {
        return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.id){
            req.user = decoded.id;
        }
        else {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        next();
    }catch(err){
        return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
}

export default LoggedIn;