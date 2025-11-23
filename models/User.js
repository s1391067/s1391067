const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username : { type: String, required: true, unique: true },
  password : { type: String, required: true },
  lv       : { type: Number, default: 1 },      // level
  exp      : { type: Number, default: 0 },      // exp
  nextExp  : { type: Number, default: 10 }      // next level exp
}, { timestamps: true });

/* uid */
userSchema.virtual('userID').get(function () { return this._id.toString(); });
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

/* pw hide */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePwd = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* upgrade level */
userSchema.methods.addExp = async function (amount) {
  this.exp += amount;
  while (this.exp >= this.nextExp) { 
    this.exp   -= this.nextExp;
    this.lv    += 1;
    this.nextExp = Math.floor(this.nextExp * 1.2); 
  }
  await this.save();
  return this.lv;
};

module.exports = mongoose.model('User', userSchema);
