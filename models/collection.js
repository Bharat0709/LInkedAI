const mongoose = require("mongoose");

// Schema for posts in a collection
const postSchema = new mongoose.Schema({
  url: { type: String, required: true },
  description: { type: String },
  dateAdded: { type: Date, default: Date.now },
});

// Schema for collections
const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creationDate: { type: Date, default: Date.now },
  posts: [postSchema],
});

// Define model for collections
const Collection = mongoose.model("Collection", collectionSchema);

// Define model for posts in a collection
const Post = mongoose.model("Post", postSchema);

module.exports = { Collection, Post };
