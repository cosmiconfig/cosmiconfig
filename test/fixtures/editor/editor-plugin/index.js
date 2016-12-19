var cosmiconfig = require("cosmiconfig");
var path = require("path");
module.exports = function(config) {
    var explorer = cosmiconfig(config.moduleName, config.options);
    return explorer.load(path.join(__dirname, "../project/index.css"))
};