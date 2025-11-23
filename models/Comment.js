const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  _id: { type: String },
  post: { type: String, ref: 'Post', required: true },
  author: { type: String, ref: 'User', required: true },
  content: { type: String, required: true },
  parent: { type: String, default: null },
  image: { data: Buffer, contentType: String }
}, { timestamps: true });

commentSchema.pre('save', async function () {
  if (!this._id) {
    const { nextCommentID, nextSubCommentID } = require('../utils/idGenerator');
    this._id = this.parent ? await nextSubCommentID() : await nextCommentID();
  }
});

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent'
});
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);