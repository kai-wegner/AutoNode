var db;
var framework;

exports.meta = {
    name: "Simple Message Saver",
    version: '0.5.0',
    enabled: true
}

exports.init = function(configuration) {
    framework = configuration.framework;
    db = framework.database('messages');

    console.log(this.meta.name + " loaded! (" + (this.meta.enabled || this.meta.enabled == null ? 'enabled' : 'disabled') + ")");
};

var processCommunication = function(event, funcGetContent) {
    var communication = event.message;
    var newMessage = event.framework.model('message').new();
    newMessage.content = funcGetContent(communication);
    newMessage.sender = communication.sender;
    newMessage.type = communication.getCommunicationType();
    db.insert(newMessage);

    if (event.socket != null) {
        event.socket.send(newMessage);
    }
    return newMessage;
}
exports.newMessage = function(event) {
    processCommunication(event, function(communication) {
        return communication.message
    })
};
exports.newNotification = function(event) {
    processCommunication(event, function(communication) {
        return communication.title + " - " + communication.text;
    })
};

exports.done = function(event) {};