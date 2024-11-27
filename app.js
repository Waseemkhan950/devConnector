const express = require("express");
const app = express();
const connectDB = require("./config/db");
var bodyParser = require("body-parser");
//connect database
connectDB();
//middlewares
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(express.json({ extended: false }));
app.get("/", (req, res) => res.send("Api is running."));
//define routes
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));
const PORT = process.env.Port || 5000;
app.listen(PORT, () => console.log(`app is running at ${PORT}`));
