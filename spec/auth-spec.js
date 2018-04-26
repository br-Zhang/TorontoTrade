const request = require('request');
const config = require('../config.json');
const port = process.env.PORT || config.port;
const baseUrl = 'http://localhost:' + port + '/';
const signUp = 'api/signup';
const signIn = 'api/signin';
const randomstring = require('randomstring');

require('../app.js');

describe('Authentication Test', function() {
    describe('POST /api/signup with no username', function() {
        it('returns status code 400 with error message', function(done) {
            request.post({
                json: {
                    'password': 'alice',
                },
                url: baseUrl + signUp,
            },
            function(err, res, body) {
                expect(res.statusCode).toBe(400);
                expect(body).toBe('Username is missing.');
                done();
            });
        });
    });

    describe('POST /api/signup with no password', function() {
        it('returns status code 400 with error message', function(done) {
            request.post({
                json: {
                    'username': 'alice',
                },
                url: baseUrl + signUp,
            },
            function(err, res, body) {
                expect(res.statusCode).toBe(400);
                expect(body).toBe('Password is missing.');
                done();
            });
        });
    });

    describe('POST /api/signup with existing username', function() {
        it('returns status code 409 with error message', function(done) {
            const email = randomstring.generate() + '@gmail.com';

            request.post({
                json: {
                    'username': 'alice',
                    'password': 'alice',
                    'email': email,
                },
                url: baseUrl + signUp,
            },
            function(err, res, body) {
                expect(res.statusCode).toBe(409);
                expect(body).toBe('Username alice already exists.');
                done();
            });
        });
    });

    describe('POST /api/signin with existing username', function() {
        it('returns status code 200 with success messsage', function(done) {
            request.post({
                json: {
                    'username': 'alice',
                    'password': 'alice',
                },
                url: baseUrl + signIn,
            },
            function(err, res, body) {
                expect(res.statusCode).toBe(200);
                expect(body).toBe('User alice has been signed in.');
                done();
            });
        });
    });

    describe('POST /api/signin with non-existing username', function() {
        it('returns status code 404 with error messsage', function(done) {
            request.post({
                json: {
                    'username': 'doesNotExist',
                    'password': 'doesNotExist',
                },
                url: baseUrl + signIn,
            },
            function(err, res, body) {
                expect(res.statusCode).toBe(401);
                expect(body).toBe('Invalid username/password.');
                done();
            });
        });
    });
});
