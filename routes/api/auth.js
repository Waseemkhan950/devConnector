const express = require("express");
const router = express.Router();
const User = require("../../models/Users");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
//jwt used to protect routes from unauthorize user
const jwt = require("jsonwebtoken");
//to access secret and confidentail information
const config = require("../../config/default.json");
//auth as middleware to protect the route if user dont have token
router.get("/", auth, async (req, res) => {
	//req.user contains a user object which is coming from auth middleware
	try {
		// select("-password") ensuring password is not coming in response
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});
//login functionality
router.post(
	"/", //route
	[
		//multiple validations in array used as middleware
		check("email", "please include a valid email").isEmail(),
		check("password", "Password is required").exists(),
	],
	async (req, res) => {
		const { email, password } = req.body;
		//to grab error from validations
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there is error
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			let user = await User.findOne({ email: email }); // check if user already exists using email
			if (!user) {
				res.status(400).json({
					errors: [{ msg: "Invalid Credentials" }],
				});
			}
			//comparing incoming plain password with the encrypted password
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				res.status(400).json({
					errors: [{ msg: "Invalid Credentials" }],
				});
			}
			const payload = {
				user: {
					id: user.id, // mongoose allow you to access _id by just id
				},
			};
			jwt.sign(
				// creating jwt token
				payload,
				config.jwtSecret,
				{ expiresIn: 36000 },
				(err, token) => {
					// checking for error, if not returning token
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send();
		}
	}
);
module.exports = router;
