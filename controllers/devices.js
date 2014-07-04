var plugins = require('../lib/plugins'),
    config2json = require('../lib/config2json'),
    arcomm = require('autoremote.js');

exports.install = function(framework) {
    var self = this;

    framework.route('/devices', renderDevices);
    framework.route('/devices/list', listDevices, ['+xhr']);

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