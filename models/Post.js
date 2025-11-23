const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  _id: { type: String },
  title: String,
  body: String,
  author: { type: String, ref: 'User' },
  image: [{ data: Buffer, contentType: String }],
  likes: [{ type: String }],
  dislikes: [{ type: String }]
}, { timestamps: true });

postSchema.pre('save', async function () {
  if (!this._id) {
    const { nextPostID } = require('../utils/idGenerator');
    this._id = await nextPostID();
  }
});

module.exports = mongoose.model('Post', postSchema);
