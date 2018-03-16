const request = require('request');
const config = require('../config.json');
const port = process.env.PORT || config.port;
const baseUrl = 'http://localhost:' + port + '/';
const signUp = 'api/signup';
const signIn = 'api/signin';

require('../app.js');

describe('Authentication Test', function() {
    describe('POST /api/signup with existing username', function() {
        it('returns status code 409 with error message', function(done) {
            request.post({
                json: {
                    'username': 'alice',
                    'password': 'alice',
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
