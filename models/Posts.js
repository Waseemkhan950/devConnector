const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PostSchema = new Schema({
      user: {
            //to link user model with the post
            type: Schema.Types.ObjectId,
            ref: "users",
      },
      text: {
            //text area
            type: String,
            required: true,
      },
      name: {
            //post title
            type: String,
      },
      avatar: {
            //avatar of user
            type: String,
      },
      likes: [
            // store id of users who liked the post
            {
                  user: {
                        type: Schema.Types.ObjectId,
                        ref: "users",
                  },
            },
      ],
      comments: [
            {
                  user: {
                        type: Schema.Types.ObjectId,
                        ref: "users",
                  },
                  text: {
                        type: String,
                        required: true,
                  },
                  date: {
                        type: Date,
                        default: Date.now,
                  },
            },
      ],
      date: {
            type: Date,
            default: Date.now,
      },
});
module.exports = Post = mongoose.model("post", PostSchema);
