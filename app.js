// jshint esversion: 6
const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static('frontend'));

const multer = require('multer');
const upload = multer({dest: path.join(__dirname, 'uploads')});

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
    console.log('HTTP request', req.method, req.url, req.body, req.username);
    return next();
});

app.set('views', './views');
app.set('view engine', 'pug');

const mongoose = require('mongoose');
mongoose.connect('mongodb://' + url);
const mdb = mongoose.connection;

const Listing = require('./models/listing-model');
const User = require('./models/user-model');

mdb.on('error', console.error.bind(console, 'connection error:'));
mdb.once('open', function() {
    console.log('Connected through mongoose!');

    // TODO: Separate front end from API into two web applications

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
        const email = req.body.email;

        User.findOne({email: email}, function(err, user) {
            if (err) {
                return res.status(500).end('Unable to retrieve users.');
            }
            if (user) {
                return res.status(409).end(
                    'Email ' + email + ' already exists.'
                );
            }

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
                    {username: username, hash: hash, salt: salt, email: email},
                    {upsert: true}, function(err) {
                    if (err) return res.status(500).end(err);
                    return res.json(
                        'User ' + username + ' has been signed up.'
                    );
                });
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
                return res.status(401).end('Invalid username/password.');
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
                userId: req.user._id,
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
    app.get('/api/listings/:id', function(req, res, next) {
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

    app.get('/api/listings/', function(req, res, next) {
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        Listing.find({})
        .sort({'updated': -1})
        .skip(offset)
        .limit(limit)
        .exec(function(err, listings) {
            if (err) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            return res.json(listings);
        });
    });

    // Retrieves the picture of the listing.
    //
    // Returns:
    // 200 OK containing picture of the listing if successful.
    // 404 Not Found if the id does not correspond to any existing listing.
    // 500 Internal Server Error if failed to retrieve listings.
    app.get('/api/listings/:id/picture/', function(req, res, next) {
        Listing.findOne({_id: req.params.id}, function(err, listing) {
            if (err) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            if (listing == null) {
                return res.status(404).end(
                    'No listing with id: ' + req.params.id + ' exists.'
                );
            }
            request(listing.image_url).pipe(res);
        });
    });

    app.get('/signin', function(req, res, next) {
        res.render('signin', { });
    });

    app.get('/listings/:id/details/', function(req, res, next) {
        Listing.findById(req.params.id).exec(function(err, listing) {
            // TODO: Update to display better error message. Possibly passing
            // control to another function with an error.pug and sending
            // this error message.
            if (err) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            if (listing == null) {
                return res.status(404).end(
                    'No listing with id: ' + req.params.id + ' exists.'
                );
            }
            User.findById(listing.userId).exec(function(err, user) {
                const username = (err || user == null) ? '' : user.username;
                return res.render('details', {
                    id: listing.id,
                    title: listing.title,
                    price: listing.priceToString(),
                    category: listing.category,
                    description: listing.description,
                    image_url: listing.url,
                    image_id: listing.public_id,
                    username: username,
                });
            });
        });
    });

    app.put('/api/listings/:id', upload.single('picture'), isAuthenticated,
    function(req, res, next) {
        // Retrieve user from the database
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

            let newData = newListing.toObject();
            delete newData._id;

            Listing.update({_id: req.params.id}, newData,
            {upsert: true}, function(err, result) {
                if (err) {
                    return res.status(500).end('Unable to update listing.');
                }
                // Add n field (number of updated documents) to JSON response
                newData.n=result.n;
                return res.json(newData);
            });
        });
    });

    // TODO: Mark listing as sold. Create some sort of communication channel.
    app.post('/api/purchase/:id', isAuthenticated, function(req, res, next) {

    });

    // Deletes an existing listing.
    //
    // Returns:
    // 200 OK containing JSON object of the deleted listing if successful.
    // 404 Not Found if the id does not correspond to any existing listing.
    // 500 Internal Server Error if failed to retrieve listings.
    app.delete('/api/listings/:id', isAuthenticated, function(req, res, next) {
        Listing.deleteOne({_id: req.params.id}, function(err, result) {
            if (result) {
                return res.status(500).end('Unable to retrieve listings.');
            }
            if (result.n == 0) {
                return res.status(404).end(
                    'No listing with id: ' + req.params.id + ' exists.'
                );
            }
            return res.json({
                _id: req.params.id,
            });
        });
    });

    const http = require('http');
    const PORT = process.env.PORT || config.port;
    http.createServer(app).listen(PORT, function(err) {
        if (err) console.log(err);
        else console.log('HTTP server on http://localhost:%s', PORT);
    });
});
