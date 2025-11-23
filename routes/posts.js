const router = require('express').Router();
const Post    = require('../models/Post');
const Comment = require('../models/Comment');
const User    = require('../models/User'); 


function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}


router.get('/', requireAuth, async (req, res) => {
  const [posts, user] = await Promise.all([
    Post.find().populate('author', 'username lv').sort({ createdAt: -1 }).lean(),
    User.findById(req.session.userId).select('_id username lv exp nextExp').lean()
  ]);
  res.render('index', { posts, user });
});


/* new post */
router.get('/new', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select('_id username lv exp nextExp').lean();
  res.render('new', { user });
});

/* new post exp */
router.post('/', requireAuth, async (req, res) => {
  try {
    const postData = {
      title: req.body.title,
      body : req.body.body,
      author: req.session.userId.toString()
    };
    if (req.files && req.files.length) {
      postData.image = req.files.map(f => ({
        data: f.buffer,
        contentType: f.mimetype
      }));
    }
    const post = await Post.create(postData);

    const author = await User.findById(req.session.userId);
    await author.addExp(15);

    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('create post fail');
  }
});

/* post info= */
router.get('/:id', requireAuth, async (req, res) => {
  const [post, comments, user] = await Promise.all([
  Post.findById(req.params.id).populate('author', 'username lv'),
  Comment.find({ post: req.params.id, parent: null })
         .populate('author', 'username lv')
         .populate({ path: 'replies', populate: { path: 'author', select: 'username lv' } })
         .sort({ createdAt: 1 }),
  User.findById(req.session.userId).select('_id username lv exp nextExp') 
]);
post.image = post.image.filter(img => img && img.data);
res.render('post', { post, comments, user });
});


router.get('/image/:id/:index?', async (req, res) => {
  const post  = await Post.findById(req.params.id);
  const idx   = parseInt(req.params.index) || 0;
  if (!post || !post.image || !Array.isArray(post.image) || !post.image[idx]) {
    return res.status(404).send('photo not found');
  }
  res.contentType(post.image[idx].contentType);
  res.send(post.image[idx].data);
});


router.get('/image/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !post.image) return res.status(404).send('photo not found');
  const img = Array.isArray(post.image) ? post.image[0] : post.image;
  if (!img || !img.data) return res.status(404).send('photo not found');
  res.contentType(img.contentType);
  res.send(img.data);
});

/* edit page */
router.get('/edit/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author !== req.session.userId) {
    req.session.flash = { type: 'error', message: '❌ Not your post! You can only edit your own posts.' };
    return res.redirect('back');
  }
  const user = await User.findById(req.session.userId).select('_id username lv exp nextExp').lean();
  res.render('edit', { post, user });
});

/* update */
router.put('/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author !== req.session.userId) return res.status(403).send('Not your post');

  let keepImages = post.image || [];
  if (req.body.deletePhotos) {
    const deleteIndices = Array.isArray(req.body.deletePhotos) 
      ? req.body.deletePhotos.map(i => parseInt(i))
      : [parseInt(req.body.deletePhotos)];
    
    keepImages = keepImages.filter((_, index) => !deleteIndices.includes(index));
  }

  const newImages = req.files ? req.files.map(f => ({
    data: f.buffer,
    contentType: f.mimetype
  })) : [];

  const updatedImages = [...keepImages, ...newImages];

  await Post.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
    body: req.body.body,
    image: updatedImages
  });

  res.redirect('/posts');
});

/* delete */
router.delete('/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author !== req.session.userId) {
    req.session.flash = { type: 'error', message: '❌ Not your post! You can only delete your own posts.' };
    return res.redirect('back');
  }
  await Post.findByIdAndDelete(req.params.id);
  res.redirect('/posts');
});


/* delete comment */
router.delete('/comments/:id', requireAuth, async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).send('Comment not found');
  if (comment.author !== req.session.userId) {
    req.session.flash = { type: 'error', message: '❌ Not your comment! You can only delete your own comments.' };
    return res.redirect('back');
  }
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect('back');
});

/* like */
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId.toString();
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).send('Post not found');
    
    const isLiked = post.likes.includes(userId);
    const isDisliked = post.dislikes.includes(userId);
    
    if (isLiked) {
      post.likes.pull(userId);
    } else {
      if (isDisliked) post.dislikes.pull(userId);
      post.likes.push(userId);
    }
    
    await post.save();
    res.redirect('back');
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).send('Vote failed');
  }
});

/* dislike */
router.post('/:id/dislike', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId.toString();
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).send('Post not found');
    
    const isLiked = post.likes.includes(userId);
    const isDisliked = post.dislikes.includes(userId);
    
    if (isDisliked) {
      post.dislikes.pull(userId);
    } else {
      if (isLiked) post.likes.pull(userId);
      post.dislikes.push(userId);
    }
    
    await post.save();
    res.redirect('back');
  } catch (err) {
    console.error('Dislike error:', err);
    res.status(500).send('Vote failed');
  }
});

module.exports = router;
