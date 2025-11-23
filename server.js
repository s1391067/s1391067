require('dotenv').config();
const express        = require('express');
const mongoose       = require('mongoose');
const session        = require('cookie-session');
const methodOverride = require('method-override');
const multer         = require('multer');
const app            = express();

mongoose.connect('mongodb+srv://candy-108:candy0108@cluster0.4h5wsd3.mongodb.net/Blog?retryWrites=true&w=majority');


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboardcat',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  if (req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  }
  next();
});

app.use((req, res, next) => {
  console.log('>>> get request：', req.method, req.url, 'body=', req.body);
  next();
});

app.set('view engine', 'ejs');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only can upload photos'));
  }
});

app.use(express.static('public'));
app.use('/', require('./routes/auth'));
app.use('/posts', upload.array('image', 5), require('./routes/posts'));
app.use('/api', require('./routes/api'));
app.use('/comments', upload.single('image'), require('./routes/comments'));
app.use('/', upload.single('image'), require('./routes/comments'));

app.use((err, req, res, next) => {
  console.error('>>> server error：', err.message);
  console.error(err.stack);
  res.status(500).send(err.message || 'Server error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
app.get('/', (req, res) => res.redirect('/posts'));
