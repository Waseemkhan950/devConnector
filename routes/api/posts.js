const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Post = require("../../models/Posts");
const User = require("../../models/Users");
const Profile = require("../../models/Profile");
//@route POST api/post
//@desc  Add new post
//access Private
router.post(
      "/",
      [auth, [check("text", "Text is required").not().isEmpty()]],
      async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
            }
            try {
                  //user id is taken from token; it will return user's detail except password
                  const user = await User.findById(req.user.id).select(
                        "-password"
                  );
                  const newPost = new Post({
                        text: req.body.text,
                        name: user.name,
                        avatar: user.avatar,
                        user: req.user.id,
                  });
                  const post = await newPost.save();
                  res.json(post);
            } catch (error) {
                  console.error(error.message);
                  res.status(500).send("Server Error");
            }
      }
);
//@route GET api/post
//@desc  Get all posts
//access Private
router.get("/", auth, async (req, res) => {
      try {
            const posts = await Post.find().sort({ date: -1 }); //sort new to old
            res.json(posts);
      } catch (error) {
            console.error(error.message);
            res.status(500).json("Server Error");
      }
});
//@route GET api/post/id
//@desc  Get one post by id
//access Private
router.get("/:id", auth, async (req, res) => {
      try {
            const post = await Post.findById(req.params.id);
            //if post not found with that id
            if (!post) {
                  return res.status(404).json({ msg: "Post not found" });
            }
            res.json(post);
      } catch (error) {
            console.error(error.message);
            //to check if the incoming id is invalid
            if (error.kind === "ObjectId") {
                  return res.status(404).json({ msg: "Post not found" });
            }
            res.status(500).json("Server Error");
      }
});
//@route Delete api/post/id
//@desc  Delete post by id
//access Private
router.delete("/:id", auth, async (req, res) => {
      try {
            const post = await Post.findById(req.params.id);
            //if post not found
            if (!post) {
                  return res.status(404).json({ msg: "Post not found" });
            }
            // to check if the user is the same who created post
            if (post.user.toString() !== req.user.id) {
                  return res.status(404).json({ msg: "user not authorize" });
            }
            //delte post found above by function foundById
            await post.deleteOne();
            res.json({ msg: "Post removed" });
      } catch (error) {
            console.error(error.message);
            if (error.kind === "ObjectId") {
                  return res.status(404).json({ msg: "Post not found" });
            }
            res.status(500).json("Server Error");
      }
});
//@route PUT api/posts/like/id
//@desc  Like a post by id
//access Private
router.put("/like/:id", auth, async (req, res) => {
      try {
            //first finding post by id which needs to be liked
            const post = await Post.findById(req.params.id);
            //checking if the user has already liked the post
            if (
                  post.likes.filter(
                        (like) => like.user.toString() === req.user.id
                  ).length > 0
            ) {
                  return res.status(400).json({ msg: "Post already liked." });
            }
            //if post is not liked then adding the user in like array
            post.likes.unshift({ user: req.user.id });
            await post.save();
            res.status(200).json({
                  msg: "You have successfully liked the post.",
            });
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
      }
});
//@route PUT api/posts/unlike/id
//@desc  unlike a post by id
//access Private
router.put("/unlike/:id", auth, async (req, res) => {
      try {
            //first finding post by id which needs to be unliked
            const post = await Post.findById(req.params.id);
            //checking if the user has already liked the post
            if (
                  post.likes.filter(
                        (like) => like.user.toString() === req.user.id
                  ).length === 0
            ) {
                  return res
                        .status(400)
                        .json({ msg: "Post has not yet been liked." });
            }
            //Get remove index
            const removeIndex = post.likes
                  .map((like) => like.user.toString())
                  .indexOf(req.user.id);
            post.likes.splice(removeIndex, 1);
            await post.save();
            res.status(200).json({
                  msg: "You have successfully unliked the post.",
            });
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
      }
});
//@route POST api/posts/comment/id
//@desc  Add new comment
//access Private
router.post(
      "/comments/:id",
      [auth, [check("text", "Text is required").not().isEmpty()]],
      async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
            }
            try {
                  //get the user for name and avatar
                  const user = await User.findById(req.user.id).select(
                        "-password"
                  );
                  //get the post to embedd new comment into it
                  const post = await Post.findById(req.params.id);
                  //composing an object of comment
                  const newComment = {
                        text: req.body.text,
                        name: user.name,
                        avatar: user.avatar,
                        user: req.user.id,
                  };
                  post.comments.unshift(newComment);
                  await post.save();
                  res.json(post.comments);
            } catch (error) {
                  console.error(error.message);
                  res.status(500).send("Server Error");
            }
      }
);
//@route DELETE api/posts/comments/post_id/comment_id
//@desc  delete new comment
//access Private
router.delete("/comments/:post_id/:comment_id", auth, async (req, res) => {
      try {
            const post = await Post.findById(req.params.post_id);
            const comment = post.comments.find(
                  (comment) => comment.id === req.params.comment_id
            );
            //to check if comment exist
            if (!comment) {
                  return res
                        .status(404)
                        .json({ msg: "Comment does not exist" });
            }
            //to check if the use who deleting the comment is the same who made the comment
            if (comment.user.toString() !== req.user.id) {
                  return res.status(401).json({ msg: "User not authorized" });
            }
            //Get remove index
            const removeIndex = post.comments
                  .map((comment) => comment.user.toString())
                  .indexOf(req.user.id);
            post.comments.splice(removeIndex, 1);
            await post.save();
            res.json(post.comments);
            res.status(200).json({
                  msg: "You have successfully unliked the post.",
            });
      } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
      }
});
module.exports = router;
