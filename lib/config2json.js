function recurseBuild(path,current,value) {
  var name;
  var paths = path.split('.');
  var pathLength = paths.length-1;
  for(var i=0;i < paths.length;i++) {
    name = paths[i];
    var nextName = paths[i+1];
    if (typeof current[name] === "undefined") {

      if(!isNaN(nextName)) {
        current[name] = [];
      }
      else if(!isNaN(name)) {
        name = parseInt(name);
      }
      else
        current[name] = {};
    }

    if(i < pathLength)
      current = current[name];
    else
      current[name] = value;
  }
}

exports.parseConfig = function(rootConfigKey,config) {
  var returnObj = {};

  for(var keys in config) {
    if(keys.indexOf(rootConfigKey) == 0) {
      recurseBuild(keys,returnObj,config[keys]);
    }
  }
  return returnObj;
}
