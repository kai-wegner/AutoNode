var plugins = require('../lib/plugins'),
    config2json = require('../lib/config2json'),
    arcomm = require('autoremote.js');

exports.install = function(framework) {
    var self = this;

    framework.route('/devices', renderDevices);
    framework.route('/devices/list', listDevices, ['+xhr']);
    framework.route('/devices/getkey', getKey, ['json']);
    framework.route('/devices/add', addDevice, ['json']);
    framework.route('/devices/addFromId', addDeviceFromId, ['json']);
    framework.route('/devices/delete', deleteDevices, ['json']);
    framework.route('/devices/update', updateDevice, ['json']);
    framework.route('/devices/sendMessage', sendMessage, ['json']);
    framework.route('/devices/sendRegistration', sendRegistration, ['json']);

    arcomm.setConfig(config2json.parseConfig('autoRemote', framework.config));

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

function sendMessage() {
    var self = this;
    var messageText = this.post.message.text;
    var device = this.post.device;
    arcomm.sendMessageToDevice(device, messageText, function(response) {
        var callbackObject = {
            "text": "Message Sent!",
            "status": "ok"
        };
        if (response.responseError != null) {
            callbackObject.text = response.responseError;
            callbackObject.status = "error";
        }
        self.json({
            "result": callbackObject
        });
    });
}

function sendRegistration() {
    var self = this;
    var device = this.post;
    registerToDevice(device, function(result) {
        self.json({
            "result": result
        });
    });
}

function updateDevice() {
    var self = this;
    var deviceToUpdate = this.post;
    if (deviceToUpdate != null) {
        console.log("Updating:" + deviceToUpdate.name);
        var db = framework.database('devices');
        db.update(function(device) {
            if (device.id == deviceToUpdate.id) {
                device.name = deviceToUpdate.name;
                device.localip = deviceToUpdate.localip;
                device.port = deviceToUpdate.port;
                console.log("Found " + device.name + " do update. Updating.");
            }
            return device;
        });
    }
    self.json({
        "success": true
    });
}

function addDeviceFromId() {
    var self = this;
    var id = this.post.id;
    var insertAndGetRegistration = function(newDevice) {
        var db = framework.database('devices');
        db.remove(function(device) {
            return device.id == newDevice.id;
        });
        db.insert(newDevice);
        registerToDevice(newDevice, function(result) {
            self.json({
                "result": result
            });
        });
    }
    if (id.indexOf(":") > 0 && id.indexOf("http") < 0) {
        console.log("Adding device from IP and Port");
        //id is local IP + port
        var split = id.split(":");
        var localip = split[0];
        var port = split[1];
        if (localip != null && port != null) {
            var ipAndPort = localip + ":" + port;
            console.log("Adding device " + ipAndPort);
            var newDevice = {
                "id": ipAndPort,
                "localip": localip,
                "port": port,
                "name": ipAndPort
            }
            insertAndGetRegistration(newDevice);

        }
    } else {
        //id is personal URL
        console.log("Adding device from Personal URL");
        var self = this;
        getKeyFromShortUrl(id, function(key) {
            var newDevice = {
                "id": key,
                "name": "Unkown Device",
                "type": "unknown"
            }
            insertAndGetRegistration(newDevice);
        })
    }
}

function addDevice() {
    var self = this;
    var id = this.post.key;
    var name = this.post.name;

    //if device doesn't have a GCM key, use name as id
    if (id == null) {
        id = name;
    }
    var localip = this.post.localip;
    var port = this.post.port;
    var db = framework.database('devices');
    var newDevice = framework.model('device').new();
    newDevice.id = id;
    newDevice.name = name;
    newDevice.localip = localip;
    newDevice.port = port;
    db.remove(function(device) {
        return device.id == id;
    }, function() {
        db.insert(newDevice);
        console.log("Inserted new device: " + name);
        registerToDevice(newDevice);
        self.json({
            "success": true
        });
    });
}

function registerToDevice(device, callback) {
    arcomm.registerServerToDevice(null, device, function(response) {
        updateDeviceFromResponse(device, response, callback);
    });
}

function updateDeviceFromResponse(device, response, callback) {
    var db = framework.database('devices');
    var callbackObject = {
        "text": "Registration Sent",
        "status": "ok"
    };
    console.log("updateDeviceFromResponse :" + response);
    if (response != null && response.responseError == null) {
        if (response.id != null) {
            db.update(function(deviceFromDb) {
                if (deviceFromDb.id == device.id) {
                    console.log("Got device id from response and updated: " + response.id);
                    deviceFromDb.id = response.id;
                    deviceFromDb.name = response.name;
                    deviceFromDb.type = response.type;
                    deviceFromDb.localip = response.localip;
                    deviceFromDb.publicip = response.publicip;
                    deviceFromDb.port = response.port;
                }
                return deviceFromDb;
            });
            console.log("Registration ok");
            callback(callbackObject);
        } else {
            console.log("Waiting for GCM registration");
            callbackObject.text = "Sent registration by GCM. Waiting for response";
            callbackObject.status = "pending";
            callback(callbackObject);
        }
    } else {
        db.remove(function(deviceFromDb) {
            return deviceFromDb.id == device.id;
        })
        callbackObject.text = response.responseError;
        callbackObject.status = "error";
        callback(callbackObject);
        console.log("Got no response from device registration");
    }
}

function getKey() {
    var self = this;
    getKeyFromShortUrl(self.post.shortUrl, function(key) {
        self.json({
            "key": key
        });
    });
}

function getKeyFromShortUrl(shortUrl, callback) {
    console.log("Getting long url for " + shortUrl);
    var self = this;
    arcomm.getLongUrl(shortUrl, function(longurl) {
        var key = null;
        if (longurl != null) {
            key = longurl.substring(longurl.indexOf("key=") + 4);
            console.log("found key: " + key);
        }
        callback(key);
    });
}

function deleteDevices() {
    var self = this;
    var deviceToDelete = this.post;
    var db = framework.database('devices');
    console.log("Deleting: ");
    console.log(deviceToDelete);

    var filter = function(device) {
        return deviceToDelete.id == device.id;
    };

    db.remove(filter, function() {
        self.json({
            "success": "ok"
        });
    });
}