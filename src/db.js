var fs = require("fs");
var path = require("path");
module.exports = {
	setroot: setroot,
	open: open,
	close: close,
	get: get,
	set: set
}
var root = "../ti-data";
function setroot(_root){
	root = _root;	
}

function get(key, fn){
	var tpath = path.join(root, key);
	var str;
	if(!fs.existsSync(tpath))
		str = undefined;
	else
		str = fs.readFileSync(tpath).toString();
	fn(str);
}
function set(){
	
}
function open(){
}
function close(){
}
