var assert = require('assert');

exports.run = function(framework) {

    framework.assert('Homepage', function(name) {
        assert.ok('1' === '1', name);
    });

    framework.assert('Homepage', '/1/', function(error, data, name, code, headers) {
        assert.ok(code === 200, name);
    });

};