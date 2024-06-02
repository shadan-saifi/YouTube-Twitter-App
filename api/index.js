import { app } from "../src/app.js";
import connectDB from "../src/db/index.js";

app.get("/", async (req, res) => {
    try {
        await connectDB(); // Connect to the database
        res.send("<h1>Hello </h1>");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        res.status(500).send("Internal Server Error");
    }
});

export default app