// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";


// const connectDB=async()=>{
//     try {
//         const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log(`\n mongodb connected!! DBHos:${connectionInstance.connection.host}`);
//     } catch (error) {
//      console.log("MongoDB connection error:",error);
//      process.exit(1)        
//     }
// }

// export default connectDB

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// Establish the MongoDB connection
const connectDB = mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Set a custom timeout using setTimeout
const timeout = setTimeout(() => {
  console.error('MongoDB connection timed out');
  // Close the Mongoose connection if it's still pending
  if (dbConnection && dbConnection.readyState !== 1) {
    dbConnection.close();
  }
}, 60000); // Timeout set to 60 seconds

// Listen for successful connection
mongoose.connection.once('open', () => {
  clearTimeout(timeout); // Clear the timeout if the connection is successful
  console.log('Connected to MongoDB');
});

// Listen for connection errors
mongoose.connection.on('error', (err) => {
  clearTimeout(timeout); // Clear the timeout on error
  console.error('MongoDB connection error:', err);
});

// Listen for disconnections
mongoose.connection.on('disconnected', () => {
  clearTimeout(timeout); // Clear the timeout on disconnection
  console.log('MongoDB disconnected');
});
export default connectDB


