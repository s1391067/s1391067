const router = require('express').Router();
const User  = require('../models/User');


router.get('/login',    (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

/* register */
router.post('/register', async (req, res) => {
  try {
    console.log('【Register】get body：', req.body);
    const { username, password } = req.body;
    const exist = await User.findOne({ username });
    if (exist) {
      console.log('username is already used');
      return res.send('Username already exists!');
    }
    const user = await User.create({ username, password }); 
    req.session.userId = user._id;
    console.log('register success，userID=', user._id);
    return res.redirect('/posts');
  } catch (e) {
    console.error('resgister error：', e);
    res.status(500).send('Register error');
  }
});

/* login */
router.post('/login', async (req, res) => {
  console.log('① get body:', req.body);
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  console.log('② detected user:', user);
  if (!user) {
    console.log('③ user undefined');
    return res.send('Wrong username or password');
  }
  const ok = await user.comparePwd(password);
  console.log('④ password checking:', ok);
  if (!ok) return res.send('Wrong username or password');

  req.session.userId = user._id;
  console.log('⑤ login success');
  res.redirect('/posts');
});

/* logout */
router.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

module.exports = router;
