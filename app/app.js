import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ 
    extended:true,
    limit: "16kb" }))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

//config routes
import userRouter  from "./api/user.routes.js"
app.use("/api/v1/users", userRouter)

import videoRouter from './api/video.routes.js'
app.use("/api/v1/videos", videoRouter)

import commentRouter from './api/comment.routes.js'
app.use("/api/v1/comments",commentRouter)

import likeRouter from './api/like.routes.js'
app.use("/api/v1/likes",likeRouter)

import subscriptionRouter from './api/subscription.routes.js'
app.use("/api/v1/subscriptions",subscriptionRouter)

import playlistRouter from './api/playlist.routes.js'
app.use("/api/v1/playlist",playlistRouter)

import tweetRouter from './api/tweet.routes.js'
app.use("/api/v1/tweets",tweetRouter)

import dashboardRouter from './api/dashboard.routes.js'
app.use("/api/v1/dashboard",dashboardRouter)

import healthcheckRouter from './api/healthcheck.routes.js'
import connectDB from './db/index.js'
app.use("/api/v1/healthcheck",healthcheckRouter)


export { app }