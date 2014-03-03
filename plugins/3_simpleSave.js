var db;
var framework;

exports.meta = {
  name:"Simple Message Saver",
  version:'0.5.0',
  enabled:true
}

exports.init = function(configuration) {
  framework = configuration.framework;
  db = framework.database('messages');

  console.log(this.meta.name+" loaded! ("+(this.meta.enabled || this.meta.enabled == null? 'enabled':'disabled')+")");
};

exports.newMessage = function(event) {
  var newMessage = event.framework.model('message').new();
  newMessage.content = event.message;
  db.insert(newMessage);

  if(event.socket != null)
    event.socket.send(newMessage);
};

exports.done = function(event) {
};
