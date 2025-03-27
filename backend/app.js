import express from 'express';
import router from './routes/Routes.js'
import cors from 'cors';
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

app.use(cors({credentials: true}));
// Allow All by-default

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(router);

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Server started at http://localhost:${process.env.PORT}`);
});