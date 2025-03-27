import express from "express";
import {login,logout, register} from "../controllers/authController.js";

const Authrouter = express.Router();

Authrouter.post("/register",register)
Authrouter.post("/login",login)
Authrouter.post("/logout",logout)


export default Authrouter;