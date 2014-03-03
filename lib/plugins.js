'use strict';

var fs = require('fs');

var listener = [];

exports.init = function(init) {
  fs.readdir('plugins',function(err, files) {
    for(var i=0; i < files.length;i++) {
      var pluginFile = 'plugins/'+files[i];

      var result = fs.statSync(pluginFile);

      if(result.isDirectory())
        pluginFile = pluginFile+'/index';
      else pluginFile = pluginFile.substring(0,pluginFile.length-3);

      listener.push(
        require('../'+pluginFile));

      listener[listener.length-1].init(init);
    }
  });
}

exports.notify = function(hook, event) {
  for(var i=0; i < listener.length;i++) {
    var plugin = listener[i];
    if(plugin[hook] != null) {
      if(plugin.meta.enabled || plugin.meta.enabled == null) {
        var response = plugin[hook](event);

        event.callchain.push(plugin.meta.name);

        if(response != null)
          event.responses.push({
            plugin:plugin.meta.name,
            hook:hook,
            response:response
          })
      }
    }
  }
}
