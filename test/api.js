var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var request = require('supertest');
var expect = require('chai').expect;

var config = require('../config');

// Which schematron to test against
var schematronFileName = 'C-CDA_Schematron_1.1.sch';
var schematronPath = path.join(config.server.appDirectory, config.validator.baseDirectory, schematronFileName);

// Which xml files to test
var fileDirectory = './test/xml';

var contents = fs.readdirSync(fileDirectory);
var files = [];
for (var i = 0; i < contents.length; i++) {
    if (contents[i].slice(-4) === '.xml') {
        files.push(path.join(fileDirectory, contents[i]));
    }
}

// URL of server
var url = 'http://localhost:' + config.server.port;

var server;

function cleanup() { // Kills the server
    child_process.spawn('kill', [server.pid]);
}

var xml = fs.readFileSync(files[0], 'utf-8').toString();

describe('Server should', function() {
    this.timeout(10000);
    it('startup', function(done) {
        server = child_process.spawn('./startServer', [schematronPath]);
        setTimeout(function() {
            request(url)
                .post('/')
                .send('<xml></xml>') // Send anything to make sure the server is responsive
                .end(function (err, res) {
                    if (err) {
                        console.log(err);
                        expect('Is server running?').to.be.equal(true);
                        done();
                    }
                    else {
                        var response = JSON.parse(res.text);
                        expect(response).to.be.an('object');
                        done();
                    }
                });
        }, 1500);
    });
});
describe('Validator api should', function() {
    this.timeout(10000);
    var response;
    it('return a JSON object', function(done) {
        request(url)
            .post('/')
            .send('<xml></xml>')
            .end(function (err, res) {
                if (err) {
                    console.log(err);
                    expect('Is server running?').to.be.equal(true);
                    done();
                }
                else {
                    response = JSON.parse(res.text);
                    expect(response).to.be.an('object');
                    done();
                }
            });
    });
    it('return a JSON object with the correct fields', function(done) {
        expect(response.errorCount).to.be.a('number');
        expect(response.warningCount).to.be.a('number');
        expect(response.ignoredCount).to.be.a('number');
        expect(response.errors).to.be.an('array');
        expect(response.warnings).to.be.an('array');
        expect(response.ignored).to.be.an('array');
        done();
    });
});

for (var f = 0; f < files.length; f++) {
    describe((f + 1) + '/' + files.length + ' (' + files[f] + ')\n  Validator api should', function() {
        this.timeout(30000);
        var file = files[f];
        console.log(file);
        var xml = fs.readFileSync(file, 'utf-8').toString();
        var response;
        it('return a JSON object', function(done) {
            request(url)
                .post('/')
                .send(xml)
                .end(function (err, res) {
                    if (err) {
                        console.log(err);
                        expect('Is server running?').to.be.equal(true);
                        done();
                    }
                    else {
                        response = JSON.parse(res.text);
                        expect(response).to.be.an('object');
                        done();
                    }
                });
        });
    });
}

after(function(done) {
    cleanup();
    done();
});