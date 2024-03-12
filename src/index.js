import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express"
import connectDB from './db/index.js'
import dotenv from "dotenv"
import {app} from "./app.js";

dotenv.config({path:'./.env'})

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`app is listening at  port:${process.env.PORT}`);
    })
})



// const app=express()
// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",()=>{
//             console.log("error:",error);
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>console.log(`App is listening on port ${process.env.PORT}`))

//     } catch (error) {
//         console.log("Error:",error);
//         throw error
//     }
// })()

