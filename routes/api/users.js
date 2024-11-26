const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../../models/Users");
//gravatar is used to bring url of user image, so it can be saved in db
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
//jwt used to protect routes from unauthorize user
const jwt = require("jsonwebtoken");
//to access secret and confidentail information
const config = require("../../config/default.json");
//@route Post api/users
//@access public
//desc register user
router.post(
	"/", //route
	[
		//multiple validations in array used as middleware
		check("name", "Name is required").not().isEmpty(),
		check("email", "please include a valid email").isEmail(),
		check(
			"password",
			"Please enter a password with six or more characters"
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const { name, email, password } = req.body;
		//to grab error from validations
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there is error
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			let user = await User.findOne({ email: email }); // check if user already exists
			if (user) {
				res.status(400).json({
					errors: [{ msg: "User already exists" }],
				});
			}
			const avatar = gravatar.url(email, {
				//to grab avatar url from internet
				s: "200",
				r: "pg",
				d: "mm",
			});
			user = new User({ name, email, avatar, password }); //create a new instance of user object
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt); // changing plain password to hashed password
			await user.save(); //saving user in database and returning saved object in user
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
