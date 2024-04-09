const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoUrl");
const dbConnection = async () => {
      try {
            await mongoose.connect(db);
            console.log("mongodb connected successfully");
      } catch (err) {
            console.error(err.message);
            process.exit(1);
      }
};
module.exports = dbConnection;
