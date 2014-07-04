var db;
var framework;

exports.meta = {
    name: "Device Register",
    version: '0.0.1',
    enabled: true
}

exports.init = function(configuration) {
    framework = configuration.framework;
    db = framework.database('devices');

    console.log(this.meta.name + " loaded! (" + (this.meta.enabled || this.meta.enabled == null ? 'enabled' : 'disabled') + ")");
};

var processCommunication = function(event, funcGetContent) {
    newMessage.content = funcGetContent(communication);
    newMessage.sender = communication.sender;
    newMessage.type = communication.getCommunicationType();
    db.insert(newMessage);

    if (event.socket != null) {
        event.socket.send(newMessage);
    }
    return newMessage;
}
exports.newRequestSendRegistration = function(event) {
    var communication = event.message;
    var newDevice = event.framework.model('device').new();
    newDevice.id = communication.id;
    newDevice.name = communication.name;
    newDevice.type = communication.type;
    newDevice.localip = communication.localip;
    newDevice.publicip = communication.publicip;
    newDevice.port = communication.port;
    newDevice.haswifi = communication.haswifi;
    newDevice.additional = communication.additional;
    db.insert(newDevice);
    console.log("Inserted new device: ");
    console.log(newDevice);
};