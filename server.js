var framework = require('total.js');
var http = require('http');
var port = 1337;

if(process.argv[2] == null && process.env.npm_package_config_port != null)
  port = parseInt(process.env.npm_package_config_port);
else if(process.argv[2] != null)
  port = parseInt(process.argv[2]);

framework.run(http, false, port);
