import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
            bufferCommands: false, // Disable buffering to set custom timeout
            bufferTimeoutMS: 60000 // Set the timeout to 60 seconds
          })
        console.log(`\n mongodb connected!! DBHos:${connectionInstance.connection.host}`);
    } catch (error) {
     console.log("MongoDB connection error:",error);
     process.exit(1)        
    }
}

export default connectDB

// mongoose.connect('mongodb://localhost:27017/mydatabase', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
//   useFindAndModify: false,
//   bufferCommands: false, // Disable buffering to set custom timeout
//   bufferTimeoutMS: 60000 // Set the timeout to 60 seconds
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((err) => {
//   console.error('Failed to connect to MongoDB', err);
// });

