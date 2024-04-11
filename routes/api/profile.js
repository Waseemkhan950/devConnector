const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const request = require("request");
const config = require("../../config/default.json");
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
//@route Get api/profile
//@desc  Get all profiles
//access Public
router.get("/", async (req, res) => {
      try {
            const profiles = await Profile.find().populate("user", [
                  "name",
                  "avatar",
            ]); //populate bringing data from user document
            res.json(profiles);
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error!");
      }
});
//@route Get api/profile/user/:user_id
//@desc  Get profile by user id
//access Public
router.get("/user/:user_id", async (req, res) => {
      try {
            const profile = await Profile.findOne({
                  user: req.params.user_id,
            }).populate("user", ["name", "avatar"]); //populate bringing data from user document
            if (!profile)
                  return res
                        .status(400)
                        .json({ msg: "there is no profile for this user" });
            //if user is not found against the sent id then above will trigger
            res.json(profile);
      } catch (error) {
            console.error(error.message);
            if (error.kind == "ObjectId") {
                  //if the sent id is invalid then this will trigger
                  return res
                        .status(400)
                        .json({ msg: "there is no profile for this user" });
            }
            res.status(500).send("Server Error!");
      }
});
//@route Delete api/profile
//@desc  Delete profile and user associated with it
//access Private
router.delete("/", auth, async (req, res) => {
      try {
            //remove profile
            await Profile.findOneAndDelete({ user: req.user.id });
            //remove user
            await User.findOneAndDelete({ _id: req.user.id });
            res.json({ msg: "User deleted" });
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
      }
});
//@route PUt api/profile/education
//@desc  Add profile experience
//access Private
router.put(
      "/experience",
      [
            auth,
            [
                  check("title", "Title is required").not().isEmpty(),
                  check("company", "Company is required").not().isEmpty(),
                  check("from", "From date is required").not().isEmpty(),
            ],
      ],
      async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
            }
            const { title, company, location, from, to, current, description } =
                  req.body;
            const newExp = {
                  title: title,
                  company: company,
                  location: location,
                  from: from,
                  to: to,
                  current: current,
                  description: description,
            };
            try {
                  const profile = await Profile.findOne({ user: req.user.id });
                  profile.experience.unshift(newExp); //this will append newExp object in the array of experience
                  await profile.save();
                  res.json(profile);
            } catch (error) {
                  console.error(error.message);
                  res.status(500).send("Server Error");
            }
      }
);
//@route Delete api/profile/experience/:exp_id
//@desc  Delete experience from profile
//access Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
      try {
            const profile = await Profile.findOne({ user: req.user.id });
            //Get remove index
            const removeIndex = profile.experience
                  .map((item) => item.id)
                  .indexOf(req.params.exp_id);
            //delete item at above index from experience array
            profile.experience.splice(removeIndex, 1);
            await profile.save();
            res.json(profile);
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server failed");
      }
});

//@route PUt api/profile/education
//@desc  Add profile experience
//access Private
router.put(
      "/education",
      [
            auth,
            [
                  check("school", "Scholl is required").not().isEmpty(),
                  check("degree", "Degree is required").not().isEmpty(),
                  check("fieldOfStudy", "Field of Study is required")
                        .not()
                        .isEmpty(),
                  check("from", "From date is required").not().isEmpty(),
            ],
      ],
      async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
            }
            const {
                  school,
                  degree,
                  fieldOfStudy,
                  from,
                  to,
                  current,
                  description,
            } = req.body;
            //following is the short way to compose object if both side of ":" are same
            const newEdu = {
                  school,
                  degree,
                  fieldOfStudy,
                  from,
                  to,
                  current,
                  description,
            };
            try {
                  const profile = await Profile.findOne({ user: req.user.id });
                  profile.education.unshift(newEdu); //this will append newExp object in the array of experience
                  await profile.save();
                  res.json(profile);
            } catch (error) {
                  console.error(error.message);
                  res.status(500).send("Server Error");
            }
      }
);
//@route Delete api/profile/education/:edu_id
//@desc  Delete education from profile
//access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
      try {
            const profile = await Profile.findOne({ user: req.user.id });
            //Get remove index
            const removeIndex = profile.education
                  .map((item) => item.id)
                  .indexOf(req.params.edu_id);
            //delete item at above index from education array
            profile.education.splice(removeIndex, 1);
            await profile.save();
            res.json(profile);
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server failed");
      }
});
//@route Get api/profile/github/:username
//@desc  Get user repos from github
//access Public
router.get("/github/:username", (req, res) => {
      try {
            const options = {
                  uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.githubClientId}&client_secret=${config.githubClientSecret}`,
                  method: "GET",
                  headers: { "user-agent": "node.js" },
            };
            request(options, (error, response, body) => {
                  if (error) console.error(error);
                  if (response.statusCode !== 200) {
                        return res.status(404).json({
                              msg: "No Github profile found",
                        });
                  }
                  res.json(JSON.parse(body));
            });
      } catch (error) {
            console.error(err.message);
            res.status(500).send("Server Error");
      }
});
module.exports = router;
