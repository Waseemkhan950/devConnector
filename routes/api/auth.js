const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
//auth as middleware to protect the route if user dont have token
router.get("/", auth, (req, res) => {
      res.send("auth route");
});
module.exports = router;
