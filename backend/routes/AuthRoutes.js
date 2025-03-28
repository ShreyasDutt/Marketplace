import express from "express";
import {
    ChangePasswordOTP,
    login,
    logout,
    register,
    sendverificationOTP,
    verifyEmail, verifyPasswordResetOTP
} from "../controllers/authController.js";
import LoggedIn from "../middlewares/Authuser.js";

const Authrouter = express.Router();

Authrouter.post("/register",register)
Authrouter.post("/login",login)
Authrouter.post("/logout",logout)
Authrouter.post("/verifyOTP",LoggedIn, sendverificationOTP)
Authrouter.post("/checkOTP",LoggedIn, verifyEmail)
Authrouter.post("/passwordresetOTP", ChangePasswordOTP)
Authrouter.post("/checkpasswordOTP",LoggedIn, verifyPasswordResetOTP)





export default Authrouter;