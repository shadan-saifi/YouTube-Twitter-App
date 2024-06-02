import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
    },

    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref:"Comment"
    }


}, { timestamps: true })

export const Comment = mongoose.model("Comment", commentSchema)