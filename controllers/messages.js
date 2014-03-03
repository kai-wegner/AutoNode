var plugins     = require('../lib/plugins'),
    config2json = require('../lib/config2json'),
    arcomm      = require('autoRemote.js');

exports.install = function(framework) {
  var self = this;

  framework.route('/messages', renderMessages);
  framework.route('/messages/list', listMessages, ['+xhr']);
  framework.route('/messages/delete', deleteMessages, ['post']);
  framework.websocket('/', messageSocket, ['json']);

  arcomm.setConfig(config2json.parseConfig('autoRemote',framework.config));

  framework.autoNode = config2json.parseConfig('autoNode',framework.config).autoNode;

  for(var i=0; i < framework.autoNode.registerTo.length;i++)
    arcomm.registerServerToDevice(null,{key:framework.autoNode.registerTo[i]});

  plugins.init(
    {
      autoRemote:arcomm,
      registeredDevices:framework.autoNode.registerTo,
      framework:framework
    });

};

exports.functions = {
  processMessage: function(controller) {
    var message = controller.post.message || controller.get.message;
    var sender = controller.post.sender != null ? controller.post.sender : "-not available-";

    var pluginMessage = {
      query:controller.post,
      request:controller.req,
      message:message,
      sender:sender,
      callchain:[],
      responses:[],
      framework:controller,
      socket:socket
    }

    plugins.notify("newMessage",pluginMessage);

    plugins.notify("done",pluginMessage);

    controller.plain('OK');
  }
};

function renderMessages() {
  var self = this;

  self.view('messages',{webSocketURL_client:framework.config.webSocketURL_client});
}

var socket;
function messageSocket() {
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

    messages.sort(function(a, b){
      var dateA=new Date(a[sortProperty]),
          dateB=new Date(b[sortProperty]);
      if(!sortDesc)
        return dateA-dateB;
      else
        return dateB-dateA;
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

  db.remove(filter, function(){
    self.json({response:"ok"});
  });
}
