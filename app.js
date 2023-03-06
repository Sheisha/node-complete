﻿const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression =  require('compression');
const morgan = require('morgan');


const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.j4yjtgd.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
// user: admin-alexia
// pass: test123
// db: shop
const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage =  multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, 'images');
    },
    filename: (req,file,cb) => {
        cb(null,new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const fileFilter = (req,file,cb) => {
   if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    cb(null, true);
   } else {
    cb(null, false);
   }
};

app.set('view engine', 'ejs');
app.set('views', 'views'); // asa express va sti folderul views ( in cazul meu se numeste views)
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), 
    {flags: 'a'}
);

// app.use(helmet());
app.use(compression()); // micsoreaza size-ul cssurilor
app.use(morgan('combined', {stream: accessLogStream})); //requesturi in file access.log


app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public'))); // pentru CSS
app.use('/images', express.static(path.join(__dirname, 'images'))); // pentru CSS

app.use(
    session({
        secret: 'my secret', 
        resave: false, 
        saveUninitialized: false,
        store: store
    })
);

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req,res,next) => {
    // throw new Error('Dummy');
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        // throw new Error('Dummy');
        if(!user){
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
});




app.use('/admin',adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res,next) => {
    console.log(error);
    res.status(500).render('500', {
        pageTitle: 'Error', 
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

//port: 3000
mongoose
    .connect(MONGODB_URI)
    .then(result => {
        // https
        //     .createServer({key: privateKey, cert: certificate}, app)
        //     .listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);

    })
    .catch(err => {
        console.log(err);
    });
//pt mongodb
// mongoConnect(() => {
//     app.listen(3000)
// });
