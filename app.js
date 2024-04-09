const express = require("express");
const app = express();
const connectDB = require("./config/db");
//connect database
connectDB();
app.get("/", (req, res) => res.send("Api is running."));
const PORT = process.env.Port || 5000;
app.listen(PORT, () => console.log(`app is running at ${PORT}`));
