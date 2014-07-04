var plugins = require('../lib/plugins'),
    config2json = require('../lib/config2json'),
    arcomm = require('autoremote.js');

exports.install = function(framework) {
    var self = this;

    framework.route('/devices', renderDevices);
    framework.route('/devices/list', listDevices, ['+xhr']);
    framework.route('/devices/getkey', getKey, ['json']);
    framework.route('/devices/add', addDevice, ['json']);
    framework.route('/devices/delete', deleteDevices, ['post']);

    arcomm.setConfig(config2json.parseConfig('autoRemote', framework.config));

};

exports.functions = {
    processMessage: function(controller) {
        var communicationAutoRemote = arcomm.getCommunicationFromPayload(controller.post);

        var response = communicationAutoRemote.executeRequest();

        var pluginMessage = {
            query: controller.post,
            request: controller.req,
            message: communicationAutoRemote,
            sender: communicationAutoRemote.sender,
            callchain: [],
            responses: [],
            framework: controller,
            socket: socket
        }

        var eventType = "new" + communicationAutoRemote.getCommunicationType();

        console.log("Notifying plugins of event " + eventType);
        plugins.notify(eventType, pluginMessage);

        plugins.notify("done", pluginMessage);

        var responseText = JSON.stringify(response);
        controller.plain(response);
    }
};

function renderDevices() {
    var self = this;

    self.view('devices', {
        webSocketURL_client: framework.config.webSocketURL_client
    });
}

function listDevices() {
    var self = this;
    var db = framework.database('devices');

    var sortProperty = self.get.sidx;
    var sortDesc = self.get.sord === 'desc';

    db.all(function(devices) {

        self.json(devices);
    });
}

function addDevice() {
    var self = this;
    var id = this.post.key;
    var name = this.post.name;
    var db = framework.database('devices');
    var newDevice = framework.model('device').new();
    newDevice.id = id;
    newDevice.name = name;
    db.remove(function(device) {
        return device.id == id;
    }, function() {
        db.insert(newDevice);
        console.log("Inserted new device: " + name);
        arcomm.registerServerToDevice(null, newDevice);
        self.json({
            "result": true
        });
    });
}

function getKey() {
    var self = this;
    arcomm.getLongUrl(self.post.shortUrl, function(longurl) {
        var key = null;
        if (longurl != null) {
            key = longurl.substring(longurl.indexOf("key=") + 4);
            console.log("found key: " + key);
        }
        self.json({
            "key": key
        });
    });
}

function deleteDevices() {
    var self = this;
    var db = framework.database('devices');
    var delObjects = self.post["delete[]"];

    var filter = function(doc) {
        return delObjects.indexOf(doc.id) !== -1;
    };

    db.remove(filter, function() {
        self.json({
            response: "ok"
        });
    });
}