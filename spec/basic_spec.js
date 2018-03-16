const request = require('request');
const config = require('../config.json');
const port = process.env.PORT || config.port;
const baseUrl = 'http://localhost:' + port + '/';

describe('Basic App Test', function() {
    describe('GET /', function() {
        it('returns status code 200', function(done) {
            request.get(baseUrl, function(err, res, body) {
                expect(res.statusCode).toBe(200);
                done();
            });
        });
    });
});
