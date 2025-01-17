// Function to add a new post to a collection
const { Collection, Post } = require('./../models/collection'); // Import the Mongoose models
const catchAsync = require('./../utils/catchAsync');

exports.addtocollection = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { collectionId, collectionName, postURL, postDescription } = req.body;
    let collection;

    if (collectionId && collectionId != null) {
      collection = await Collection.findById(collectionId);
    } else {
      collection = new Collection({
        name: collectionName,
        userId: userId,
      });

      // Check if the user has reached the limit of 5 collections
      const userCollectionsCount = await Collection.countDocuments({
        userId: userId,
      });
      if (userCollectionsCount >= 10) {
        throw new Error('Maximum limit of 10 collections reached');
      }

      await collection.save();
    }

    // Check if the collection has reached the limit of 10 posts
    if (collection.posts.length >= 10) {
      throw new Error('Maximum limit of 10 posts per collection reached');
    }

    // Create a new post
    const newPost = new Post({
      url: postURL,
      description: postDescription,
    });

    // Add the new post to the collection
    collection.posts.push(newPost);
    await collection.save();
    res.status(200).json({ collection });
  } catch (error) {
    throw new Error('Failed to add post');
  }
});

exports.browseCollections = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const collections = await Collection.find({ userId: userId });

    res.status(200).json({ collections });
  } catch (error) {
    throw new Error('Failed to browse collections');
  }
});

exports.deleteCollectionPost = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const collectionId = req.params.collectionId;
  const postId = req.params.postId;

  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: 'Collection not found' });
    }

    if (!collection.userId.equals(userId)) {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access' });
    }

    const post = collection.posts.find((post) => post._id.equals(postId));

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found in the collection' });
    }

    collection.posts.pull(post._id);
    await collection.save();

    await Post.findByIdAndDelete(postId);

    res
      .status(200)
      .json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
});

exports.deleteCollection = catchAsync(async (req, res, next) => {
  const collectionId = req.params.collectionId;

  try {
    const collection = await Collection.findById(collectionId);

    // Check if the collection exists
    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: 'Collection not found' });
    }

    // Check if the collection belongs to the current user
    if (collection.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access' });
    }

    // Delete the collection
    await Collection.findByIdAndDelete(collectionId);
    res
      .status(200)
      .json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error deleting collection' });
  }
});
