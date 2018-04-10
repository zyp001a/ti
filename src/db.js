var fs = require("fs");
var path = require("path");
var parse = require("./db-parser").parse;
module.exports = {
	setroot: setroot,
	open: open,
	close: close,
	get: get,
	set: set
}
var root = "./root";
function setroot(_root){
	root = _root;	
}

function get(key, fn){
	var tpath = path.join(root, key+".td");
	var str;
	if(!fs.existsSync(tpath))
		str = undefined;
	else
		str = parse(fs.readFileSync(tpath).toString());
	fn(str);
}
function set(obj, fn){
	
	fn();
}
function unparse(obj){
	for(var key in obj){
		
	}
	return str;	
}
function open(){
}
function close(){
}
