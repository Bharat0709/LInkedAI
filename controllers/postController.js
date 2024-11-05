// controllers/postController.js
const { detectTopicGemini } = require('../controllers/apiController');
const supabase = require('../supabaseClient');

exports.analyzePost = async (req, res) => {
  try {
    const { content, category, likes, comments, author, author_url } = req.body;

    const user = req.user;

    const { data, error } = await supabase
      .from('PostsCollection')
      .insert([
        {
          UserId: user._id,
          Content: content,
          Category: category,
          Likes: likes || 0,
          Comments: comments || 0,
          Author: author,
          Author_URL: author_url,
        },
      ])
      .single();

    if (error) {
      console.error('Error inserting post:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error saving post to database',
        error: error.message,
      });
    }

    const detectedTopic = await detectTopicGemini(content);
    if (detectedTopic) {
      res.status(201).json({
        status: 'success',
        topic: detectedTopic,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Unexpected error detecting post topic',
      });
    }
  } catch (err) {
    console.error('Unexpected error saving post:', err);
    res.status(500).json({
      status: 'error',
      message: 'Unexpected error saving post to database',
    });
  }
};
