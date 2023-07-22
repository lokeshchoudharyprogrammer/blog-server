const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const { userRouter } = require('./UserRouter');
require('dotenv').config()
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// app.use(cors({ origin: '*', credentials: true }));
app.use(cors({ credentials: true, origin: '*' }));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
mongoose.set("strictQuery", false);

app.use('auth', userRouter)
app.get('/profile', (req, res) => {


    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token missing.' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }


        res.json(user);

    });
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);


    // jwt.verify(token, secret, {}, async (err, info) => {
    //     if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,

    });
    res.json(postDoc);
    // });


});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const token = req.header('Authorization');
    // jwt.verify(token, secret, {}, async (err, info) => {
    //     if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
        return res.status(400).json('you are not the author');
    }
    await postDoc.update({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
    // });

});

app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
})

app.listen(4000, () => {
    try {
        mongoose.connect(process.env.MONGO_URL);
        console.log("Db Conact")


    } catch (error) {

    }
});