const dayjs = require('dayjs');

async function nextID(model, prefix = '') {
  const today = dayjs().format('YYYY-MM-DD');
  const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  const reg = new RegExp(`^${prefix}${today}-${letter}-\\d{4}$`);
  const last = await model.findOne({ _id: reg }).sort({ _id: -1 });
  let seq = 1;
  if (last) seq = parseInt(last._id.slice(-4), 10) + 1;
  return `${prefix}${today}-${letter}-${String(seq).padStart(4, '0')}`;
}

module.exports = {
  async nextPostID() { return nextID(require('../models/Post'), ''); },
  async nextCommentID() { return nextID(require('../models/Comment'), 'C-'); },
  async nextSubCommentID() { return nextID(require('../models/Comment'), 'SC-'); }
};