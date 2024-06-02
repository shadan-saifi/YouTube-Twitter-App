import { ApiError } from "./ApiError.js";


// const asyncHandler=(requestHandler)=>{
//   return (req,res,next)=>{
//     Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
//   }
// }


// export {asyncHandler}

//or

const asyncHandler=(fn)=>async(req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
      // Handle the custom error
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: error.success,
          statusCode:error.statusCode,
          message: error.message || "Error before running api",
          errors: error.errors,
        });
      }
    
      // Handle other errors or unexpected situations
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
}
export {asyncHandler}