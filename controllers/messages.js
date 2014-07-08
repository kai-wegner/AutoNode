var plugins = require('../lib/plugins'),
    config2json = require('../lib/config2json'),
    arcomm = require('autoremote.js');

exports.install = function(framework) {
    var self = this;

    framework.route('/messages', renderMessages);
    framework.route('/messages/list', listMessages, ['+xhr']);
    framework.route('/messages/delete', deleteMessages, ['post']);
    framework.websocket('/', messageSocket, ['json']);

    arcomm.setConfig(config2json.parseConfig('autoRemote', framework.config));

    framework.autoNode = config2json.parseConfig('autoNode', framework.config).autoNode;


    var db = framework.database('devices');
    db.all(function(devices) {
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            arcomm.registerServerToDevice(null, device);
        };
    });

    plugins.init({
        autoRemote: arcomm,
        registeredDevices: framework.autoNode.registerTo,
        framework: framework
    });

};

exports.functions = {
    processMessage: function(controller) {
        var communicationAutoRemote = arcomm.getCommunicationFromPayload(controller.post);

        var db = framework.database('devices');
        var device = db.one(function(device) {
            return device.id == communicationAutoRemote.sender;
        }, function(device) {
            if (device != null) {
                console.log("Found device for message: " + device.name);
                communicationAutoRemote.device = device;
            }
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

            var eventType = "on" + communicationAutoRemote.getCommunicationType();

            console.log("Notifying plugins of event " + eventType);
            plugins.notify(eventType, pluginMessage);

            plugins.notify("done", pluginMessage);

            var responseText = JSON.stringify(response);
            controller.plain(response);
        });

    }
};

function renderMessages() {
    var self = this;

    self.view('messages', {
        webSocketURL_client: framework.config.webSocketURL_client
    });
}

var socket;

function messageSocket() {
    console.log("socket");
    var controller = this;
    socket = controller;

    controller.on('open', function(client) {
        console.log('Connect / Online:', controller.online);
    });

    controller.on('close', function(client) {
        console.log('Disconnect / Online:', controller.online);
    });

    controller.on('error', function(error, client) {
        framework.error(error, 'websocket', controller.uri);
    });
}

function listMessages() {
    var self = this;
    var db = framework.database('messages');

    var sortProperty = self.get.sidx;
    var sortDesc = self.get.sord === 'desc';

    db.all(function(messages) {

        messages.sort(function(a, b) {
            var dateA = new Date(a[sortProperty]),
                dateB = new Date(b[sortProperty]);
            if (!sortDesc)
                return dateA - dateB;
            else
                return dateB - dateA;
        });

        self.json(messages);
    });
}

function deleteMessages() {
    var self = this;
    var db = framework.database('messages');
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