var exec = require('child_process').exec;

exports.meta = {
    name: "Simple Shell",
    version: '0.5.0'
};

var autoRemote;
var registeredDevices;
exports.init = function(configuration) {
    this.autoRemote = configuration.autoRemote;
    this.registeredDevices = configuration.registeredDevices;

    console.log(this.meta.name + " loaded! (" + (this.meta.enabled || this.meta.enabled == null ? 'enabled' : 'disabled') + ")");
};


exports.newMessage = function(event) {
    if (event.message.message.indexOf('$:') == 0) {
        var command = event.message.message.substring(2);
        var registeredDevices = this.registeredDevices;
        var autoRemote = this.autoRemote;

        exec(command, function(error, stdout, stderr) {
            var response = stdout;
            console.log("Executed command '" + command + "' with response '" + response + "'");
            if (error !== null) {
                console.log('exec error: ' + error);
                response = error;
            }
            autoRemote.sendMessageToDevice({
                key: event.message.sender
            }, response);


        });
    }
};