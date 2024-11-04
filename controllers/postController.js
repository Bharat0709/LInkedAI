// controllers/postController.js
const supabase = require('../supabaseClient');

exports.createPost = async (req, res) => {
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
    res.status(201).json({
      status: 'success',
      data: data,
    });
  } catch (err) {
    console.error('Unexpected error saving post:', err);
    res.status(500).json({
      status: 'error',
      message: 'Unexpected error saving post to database',
    });
  }
};
