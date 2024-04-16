import express from "express";
const app = express();
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/dbConnect.js";
import errorMiddleware from "./middlewares/errors.js";
import path from 'path';
import { fileURLToPath } from "url";
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle Uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`ERROR: ${err}`);
    console.log('Shutting down due to uncaught expections');
    process.exit(1);
} )

// if(process.env.NODE_ENV !== "PRODUCTION") {
    dotenv.config({path:'config/config.env'});
// }

//Connnecting to database
connectDatabase();

app.use(express.json({
     limit: "10mb", 
     verify:(req, res, buf) => {
           req.rawBody = buf.toString();
     }
     })
     );

app.use(cookieParser());

//Import All routes

import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';



app.use(cors({ origin: true, credentials: true }))
app.use("/api/v1", productRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", paymentRoutes);

// if(process.env.NODE_ENV === "PRODUCTION") {
//     app.use(express.static(path.join(__dirname, "../frontend/build")));

//  app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"))
//     })
// }


// Using error middleware
app.use(errorMiddleware);

const server =  app.listen(process.env.PORT, ()=>{
    console.log(`server running port: ${process.env.PORT} in ${process.env.NODE_ENV} mode. `);
});

// Handle Unhandle Promise rejection
process.on('unhandledRejection', (err) => {
    console.log(`ERROR: ${err}`);
    console.log("server down due to unhandled promise rejection");
    server.close(() => {
        process.exit(1);
    });
});
