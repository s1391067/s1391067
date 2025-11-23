const router = require('express').Router();
const Post = require('../models/Post');


router.get('/posts', async (req,res)=>{
  const posts = await Post.find().populate('author','username');
  res.json(posts);
});


router.post('/posts', async (req,res)=>{
  const post = await Post.create(req.body);
  res.json(post);
});


router.put('/posts/:id', async (req,res)=>{
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {new:true});
  res.json(post);
});


router.delete('/posts/:id', async (req,res)=>{
  await Post.findByIdAndDelete(req.params.id);
  res.json({msg:'deleted'});
});

module.exports = router;