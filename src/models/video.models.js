import mongoose, {Schema} from "mongoose";
const videoSchema=new Schema({
    videoFile:{
        url: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    },
     thumbnail:{
        url: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:false
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

function setMaxTimeMS(next) {
    // Check if options exist and set maxTimeMS if available
    if (this._pipeline !== undefined && this.options !== undefined) {
        this.options.maxTimeMS = 30000; // Set maxTimeMS to 30 seconds (adjust as needed)
    }
    next();
}

// Apply the middleware to all aggregation hooks
videoSchema.pre('aggregate', setMaxTimeMS);

export const Video=mongoose.model("video",videoSchema)



