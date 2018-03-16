// jshint esversion: 6
const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static('frontend'));

const multer = require('multer');
const upload = multer({dest: path.join(__dirname, 'uploads')});

const ObjectID = require('mongodb').ObjectID;

const request = require('request');
const config = require('./config.json');

const dbUrl = process.env.DB_URL || config.dbUrl;
const dbUsername = process.env.DB_USERNAME || config.dbUsername;
const dbPassword = process.env.DB_PASSWORD || config.dbPassword;

// Cloudinary
const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || config.cloudinary_cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY || config.cloudinary_api_key,
  api_secret: process.env.CLOUDINARY_API_SECRET || config.cloudinary_api_secret,
});

// Connection URL
const url = dbUsername + ':' + dbPassword + '@' + dbUrl;
const monk = require('monk');
const db = monk(url);

db.then(() => {
    console.log('Connected successfully to database');
});

const users = db.get('users', {castIds: false});
const images = db.get('images', {castIds: false});
const comments = db.get('comments', {castIds: false});

const cookie = require('cookie');

const crypto = require('crypto');

/**
 * Creates a hash from the password and salt.
 * @param {String} password The password
 * @param {String} salt The salt
 * @return {String} The hash of the password and salt.
 */
function generateHash(password, salt) {
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

// Authentication middleware
const isAuthenticated = function(req, res, next) {
    if (!req.user) {
        res.setHeader('Set-Cookie', cookie.serialize('username', '', {
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
        }));
        return res.status(401).end('Access denied');
    } else {
        return next();
    }
};

const session = require('express-session');

app.use(session({
    secret: process.env.SECRET || config.secret,
    resave: false,
    saveUninitialized: true,
}));

app.use(function(req, res, next) {
    req.user = ('user' in req.session) ? req.session.user : null;
    req.username = req.user ? req.user.username : null;
    // console.log('HTTP request', req.method, req.url, req.body, req.username);
    return next();
});

const mongoose = require('mongoose');
mongoose.connect('mongodb://' + url);
const mdb = mongoose.connection;

const Listing = require('./models/listing-model');
const User = require('./models/user-model');

mdb.on('error', console.error.bind(console, 'connection error:'));
mdb.once('open', function() {
    console.log('Connected through mongoose!');

    // Sign up a new user.
    //
    // Returns:
    // 200 OK if successfully signed in.
    // 400 Bad Request if username or password was missing.
    // 409 Conflict if a user with the username already exists.
    // 500 Internal Server Error if unable to retrieve or update users.
    app.post('/api/signup/', function(req, res, next) {
        if (!('username' in req.body)) {
            return res.status(400).end('Username is missing.');
        }
        if (!('password' in req.body)) {
            return res.status(400).end('Password is missing.');
        }
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({username: username}, function(err, user) {
            if (err) {
                return res.status(500).end('Unable to retrieve users.');
            }
            if (user) {
                return res.status(409).end(
                    'Username ' + username + ' already exists.'
                );
            }

            const salt = crypto.randomBytes(16).toString('base64');
            const hash = generateHash(password, salt);

            // insert new user into the database
            User.update({username: username},
                {username: username, hash: hash, salt: salt},
                {upsert: true}, function(err) {
                if (err) return res.status(500).end(err);
                return res.json('User ' + username + ' signed up.');
            });
        });
    });

    // Sign out the current user.
    //
    // Returns:
    // 302 Found if the user was successfully signed out and
    // redirects to the home page.
    app.get('/api/signout/', isAuthenticated, function(req, res, next) {
        req.session.destroy();
        res.setHeader('Set-Cookie', cookie.serialize('username', '', {
            path: '/',
            // 1 week in number of seconds
            maxAge: 60 * 60 * 24 * 7,
        }));
        res.redirect('/');
    });

    // Sign in as a user.
    //
    // Returns:
    // 200 OK if user successfully signed in.
    // 400 Bad Request if username or password was missing.
    // 401 Unauthorized if invalid credentials were passed in.
    // 500 Internal Server Error if unable to retrieve user.
    app.post('/api/signin/', function(req, res, next) {
        if (!('username' in req.body)) {
            return res.status(400).end('Username is missing.');
        }
        if (!('password' in req.body)) {
            return res.status(400).end('Password is missing.');
        }
        const username = req.body.username;
        const password = req.body.password;

        // Retrieve user from the database
        User.findOne({username: username}, function(err, user) {
            if (err) return res.status(500).end('Unable to retrieve users.');
            if (!user) return res.status(401).end('Invalid username/password.');

            if (user.hash !== generateHash(password, user.salt)) {
                // Invalid password
                return res.status(401).end('Invalid username/password');
            }

            // start a session
            req.session.user = user;
            // initialize cookie
            res.setHeader('Set-Cookie', cookie.serialize('username', username, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            }));

            return res.json('User ' + username + ' has been signed in.');
        });
    });


    // Create a new listing.
    //
    // Returns:
    // 200 OK containing JSON object of the listing that was created if
    // successful.
    // 500 Internal Server Error if failed to create listing.
    app.post('/api/listings/', upload.single('picture'), isAuthenticated,
    function(req, res, next) {
        cloudinary.v2.uploader.upload(req.file.path, {folder: 'uploads'},
        function(err, result) {
            const newListing = new Listing({
                title: req.body.title,
                price: req.body.price,
                category: req.body.category,
                description: req.body.description,
                image_url: result.url,
                image_id: result.public_id,
            });
            newListing.save(function(err, listing) {
                if (err) {
                    return res.status(500).end('Unable to create listing.');
                }
                return res.json(listing);
            });
        });
    });

    // Retrieves an existing listing.
    //
    // Returns:
    // 200 OK containing JSON object of the listing if successful.
    // 404 Not Found if the id does not correspond to any existing listing.
    // 500 Internal Server Error if failed to retrieve listings.
    app.get('/api/listings/:id', isAuthenticated, function(req, res, next) {
        Listing.findOne({_id: req.params.id}, function(err, listing) {
            if (err) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            if (listing == null) {
                return res.status(404).end(
                    'No listing with id: ' + req.params.id + ' exists.'
                );
            }
            return res.json(listing);
        });
    });

    // Retrieves the picture of the listing.
    //
    // Returns:
    // 200 OK containing picture of the listing if successful.
    // 404 Not Found if the id does not correspond to any existing listing.
    // 500 Internal Server Error if failed to retrieve listings.
    app.get('/api/listings/:id/picture/', isAuthenticated,
    function(req, res, next) {
        Listing.findOne({_id: req.params.id}, function(err, listing) {
            if (err) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            if (doc == null) {
                return res.status(404).end(
                    'No listing with id: ' + req.params.id + ' exists.'
                );
            }
            request(listing.image_url).pipe(res);
        });
    });

    const http = require('http');
    const PORT = process.env.PORT || config.port;
    http.createServer(app).listen(PORT, function(err) {
        if (err) console.log(err);
        else console.log('HTTP server on http://localhost:%s', PORT);
    });
});

// Create

// Create an image
//
// Example usage:
// curl -X POST -F "picture=@/path/to/image" -F "title=Hello" http://localhost:3000/api/images/
//
// Returns:
// 200 OK containing JSON object of the image that was created if sucessful.
// 500 Internal Server Error if failed to create image.
app.post('/api/images/', upload.single('picture'), isAuthenticated, function (req, res, next) {
    cloudinary.v2.uploader.upload(req.file.path, { folder: "uploads" },
        function (error, result) {
            images.insert({ picture: result, author: req.user._id, title: req.body.title }, function (err, doc) {
                if (err) return res.status(500).end("Unable to create image");
                return res.json(doc);
            });
        });
});

// Create a comment
//
// Example usage:
// curl -X POST -H "Content-Type: application/json" -d '{"imageId": "aValidId", "content": "Hello!"}' http://localhost:3000/api/comments/
//
// Returns:
// 200 OK containing JSON object of the comment that was created if successful.
// 404 Not Found Error if the imageId does not correspond to any existing image.
// 500 Internal Server Error if failed to retrieve image or create comment.
app.post('/api/comments/', isAuthenticated, function (req, res, next) {
    // Check if image that the comment is commenting on exists
    images.count({ _id: ObjectID(req.body.imageId) }, function (err, count) {
        if (err) return res.status(500).end("Unable to retrieve image");
        if (count == 0) return res.status(404).end("ImageId:" + req.body.imageId + " does not exists");
        comments.insert({ imageId: req.body.imageId, author: req.user._id, content: req.body.content, date: new Date() }, function (err, doc) {
            if (err) return res.status(500).end("Unable to create comment");
            return res.json(doc);
        });
    });
});

// Read

// Returns a list of all the usernames.
//
// Example usage:
// curl -X GET -b cookie.txt http://localhost:3000/api/users
//
// Returns:
// 200 OK containing array of usernames if successful.
// 500 Internal Server Error if failed to retrieve users.
app.get('/api/users', isAuthenticated, function (req, res, next) {
    users.find({}).then(function (docs) {
        return res.json(docs.map(function (user) {
            return user._id;
        }));
    });
});

// Returns all imageIds of images for a given user.
//
// Example usage:
// curl -X GET -H "Content-Type: application/json" -b cookie.txt http://localhost:3000/api/users/alice
//
// Returns:
// 200 OK containing array of imageIds of all images if successful.
// 500 Internal Server Error if failed to retrieve images.
app.get('/api/users/:username', isAuthenticated, function (req, res, next) {
    images.find({ author: req.params.username }, { sort: { createdAt: -1 } })
    .then(function (docs) {
        return res.json(docs.map(function (elem) {
            return elem._id;
        }));
    });
});

// Gets an image.
//
// Example usage:
// curl -X GET http://localhost:3000/api/images/aValidId
//
// Returns:
// 200 OK containing JSON object of the image if successful.
// 404 Not Found Error if the imageId does not correspond to any existing image.
// 500 Internal Server Error if failed to retrieve image.
app.get('/api/images/:id/', isAuthenticated, function (req, res, next) {
    images.findOne({ _id: ObjectID(req.params.id) }, function (err, doc) {
        if (err) return res.status(500).end("Unable to retrieve image");
        if (doc == null) return res.status(404).end("ImageId:" + req.params.id + " does not exists");
        return res.json(doc);
    });
});

// Gets the image file.
//
// Example usage:
// curl -X GET http://localhost:3000/api/images/aValidId/picture/
//
// Returns:
// 200 OK containing file of the image if successful.
// 404 Not Found Error if the imageId does not correspond to any existing image.
// 500 Internal Server Error if failed to retrieve image.
app.get('/api/images/:id/picture/', isAuthenticated, function (req, res, next) {
    images.findOne({ _id: ObjectID(req.params.id) }, function(err, doc) {
		if (err) return res.status(500).end("Unable to retrieve image");
        if (doc == null) return res.status(404).end("ImageId:" + req.params.id + " does not exists");
        request(doc.picture.url).pipe(res);
    });
});

// Get comments for an image.
//
// Example usage:
// curl -X GET http://localhost:3000/api/comments/aValidId
//
// Returns:
// 200 OK containing array of JSON objects, sorted by latest creation date, that correspond to the comments of the image.
// 404 Not Found Error if the imageId does not correspond to any existing image.
// 500 Internal Server Error if failed to retrieve comments (or image).
app.get('/api/comments/:imageId/', isAuthenticated, function (req, res, next) {
    var offset = req.query.offset ? parseInt(req.query.offset) : 0;
    var limit = req.query.limit ? parseInt(req.query.limit) : 10;
    images.count({ _id: ObjectID(req.params.imageId) }, function (err, count) {
        if (err) return res.status(500).end("Unable to retrieve image");
        if (count == 0) return res.status(404).end("ImageId:" + req.params.imageId + " does not exists");
        comments.find({ imageId: req.params.imageId },
            { skip: offset, limit: limit, sort: { date: -1 } })
            .then(function (docs) {
            return res.json(docs);
        });
    });
});

// Delete

// Deletes an image.
//
// Example usage:
// curl -X DELETE http://localhost:3000/api/images/aValidId
//
// Returns:
// 200 OK containing JSON object of the image that was deleted.
// 403 Forbidden if current session user is not the author of the image.
// 404 Not Found Error if the id does not correspond to any existing image.
// 500 Internal Server Error if failed to delete the image.
app.delete('/api/images/:id', isAuthenticated, function (req, res, next) {
    images.findOne({ _id: ObjectID(req.params.id) }, function (err, doc) {
        if (doc == null) return res.status(404).end("ImageId:" + req.params.id + " does not exists");
        if (doc.author !== req.user._id) return res.status(403).end("Not authorized");
        cloudinary.v2.uploader.destroy(doc.picture.public_id, function(error, result){
            if (err) return res.status(500).end("Unable to delete image");
        });
        images.remove({ _id: ObjectID(req.params.id) }, function(err, numDeleted) {
            if (err) return res.status(500).end("Unable to delete image");
            comments.remove({ imageId: req.params.id }, { multi: true }, function (err, numRemoved) {
                if (err) res.status(500).end("Unable to delete comments");
                return res.json(doc);
            });
        });
    });
});

// Deletes a comment.
//
// Example usage:
// curl -X DELETE http://localhost:3000/api/comments/aValidCommentId
//
// Returns:
// 200 OK containing JSON object of the comment that was deleted.
// 403 Forbidden if the current session user is not the author of the comment or image.
// 404 Not Found Error if the commentId does not correspond to any existing comment.
// 500 Internal Server Error if failed to delete the comment.
app.delete('/api/comments/:id', isAuthenticated, function (req, res, next) {
    comments.findOne({ _id: ObjectID(req.params.id) }, function (err, doc) {
        if (err) return res.status(500).end("Unable to retrieve comment");
        if (doc == null) return res.status(404).end("CommentId:" + req.params.id + " does not exists");
        images.findOne({ _id: ObjectID(doc.imageId)}, function (err, image) {
            // Allow deletion of comments by comment or image author
            if (err) return res.status(500).end("Unable to retrieve image");
            if (doc.author === req.user._id || image.author === req.user._id) {
                comments.remove({ _id: ObjectID(req.params.id) }, function (err, numDeleted) {
                    if (err) return res.status(500).end("Unable to delete comment");
                    return res.json(doc);
                });
            } else {
                return res.status(403).end("Not authorized");
            }
        });
    });
});
