const router = require('express').Router();
const Comment = require('../models/Comment');
const User    = require('../models/User');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).send('please login');
  next();
}

/* delete comments */
router.delete('/:id', requireAuth, async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).send('Comment not found');
  if (comment.author !== req.session.userId) return res.status(403).send('Not your comment');
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect('back');
});


/* comment and sub-comment */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { post, content, parent = null } = req.body;
    if (parent && req.file) req.file = null; 

    const data = {
      post,
      content,
      parent,
      author: req.session.userId.toString(),
      ...(req.file && { image: { data: req.file.buffer, contentType: req.file.mimetype } })
    };
    await Comment.create(data);

    /* exp */
    const author = await User.findById(req.session.userId);
    await author.addExp(5);

    res.redirect('back'); 
  } catch (err) {
    console.error(err);
    res.status(500).send('comment fail');
  }
});

/* comment photo */
router.get('/image/:id', async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c || !c.image || !c.image.data) return res.status(404).send('photo not found');
    res.contentType(c.image.contentType);
    res.send(c.image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('load photo fail');
  }
});


router.get('/api', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.query.post, parent: null })
      .populate('author', 'username')
      .sort({ createdAt: 1 });
    const withUrl = comments.map(c => {
      const o = c.toObject();
      if (o.image) o.imageUrl = `/comments/image/${c._id}`;
      delete o.image;
      return o;
    });
    res.json(withUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'load comment fail' });
  }
});

module.exports = router;
