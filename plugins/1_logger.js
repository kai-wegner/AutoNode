exports.meta = {
    name: "Simple Logger",
    version: '0.5.0',
    enabled: true
};

exports.init = function() {
    console.log(this.meta.name + " loaded! (" + (this.meta.enabled || this.meta.enabled == null ? 'enabled' : 'disabled') + ")");
};

exports.newMessage = function(event) {
    console.log("Received Message: " + event.message.message)
};
exports.done = function(event) {
    console.log("We called: " + event.callchain);
};