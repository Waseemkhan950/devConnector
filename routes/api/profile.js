const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const { check, validationResult } = require("express-validator");
//@route Get api/profile/me
//@desc  Get current user profile
//access Private
router.get("/me", auth, async (req, res) => {
      try {
            const profile = await Profile.findOne({
                  user: req.user.id, // finding user from profile model with tha certain user id
            }).populate("user", ["name", "avatar"]); //populate allowing to fetch data from user model with array of fields [avatar, name]
            if (!profile) {
                  return res
                        .status(400)
                        .json({ msg: "There is no profile for this user" });
            }
            res.send(profile);
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
      }
});
//@route Post api/profile
//@desc  Create or update profile
//access Private
router.post(
      "/",
      [
            // for more than two middlewares, we pass them in an array
            auth, // auth to check if user has jwt validation token
            [
                  // check to ensure required fields are not empty
                  check("status", "Status is required").not().isEmpty(),
                  check("skills", "Skills is required").not().isEmpty(),
            ],
      ],
      async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  //checking if there are errors
                  return res.status(400).json({ errors: errors.array() });
            }
            const {
                  company,
                  website,
                  location,
                  bio,
                  status,
                  skills,
                  githubUsername,
                  youtube,
                  facebook,
                  twitter,
                  instagram,
                  linkedin,
            } = req.body;
            //build profile object
            const profileFields = {};
            profileFields.user = req.user.id; // extracting id from token
            if (company) profileFields.company = company;
            if (website) profileFields.website = website;
            if (location) profileFields.location = location;
            if (bio) profileFields.bio = bio;
            if (status) profileFields.status = status;
            if (githubUsername) profileFields.githubUsername = githubUsername;
            if (skills) {
                  profileFields.skills = skills
                        .split(",") // spliting array on the base of ","
                        .map((skill) => skill.trim());
            }
            //build social object
            profileFields.social = {};
            if (youtube) profileFields.social.youtube = youtube;
            if (twitter) profileFields.social.twitter = twitter;
            if (facebook) profileFields.social.facebook = facebook;
            if (linkedin) profileFields.social.linkedin = linkedin;
            if (instagram) profileFields.social.instagram = instagram;
            try {
                  // debugger;
                  let profile = await Profile.findOne({ user: req.user.id });
                  //if profile is found, then we want to update it.
                  if (profile) {
                        profile = await Profile.findOneAndUpdate(
                              { user: req.user.id },
                              { $set: profileFields },
                              { new: true }
                        );
                        if (profile) return res.json(profile);
                        console.log("update query failed!");
                  }
                  //if profile is not found then we want to create it
                  profile = new Profile(profileFields);
                  await profile.save();
                  res.json(profile);
            } catch (error) {
                  console.error(error.message);
                  res.status(500).send("Server Error");
            }
      }
);
module.exports = router;
