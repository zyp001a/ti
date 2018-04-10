var tree = require("./tree")
var cc = require("./concept")
var types = {};
module.exports = {
	types: types,
	deftype: deftype,
	deffunc: deffunc,
	init: init
}
function deftype(p, ex){
	var cpt = types[p] = cc.newcpt("TYPE");
	tree.newleaf(tree.root, p, cpt);
	if(ex)
		ex(cpt);
}
function deffunc(func, ex, makefunc){
	var argnum = func.length;
	var cpt = cc.newcpt("Function");
	cpt.val = {
		block: ['native', func],
		argdef: []
	}
	for(var i=0; i< argnum; i++){
		cpt.val.argdef.push([i]);
	}
	if(ex){
		cpt.val.rtndef = ex[0];
		for(var i =1;i<ex.length;i++){
			cpt.val.argdef[i][1] = ex[i];
		}
	}
	cpt.type = "Native";
	cpt.typex = types.Native;
	var tname = func.name.substr(1);
	tree.newleaf(tree.root, tname, cpt);
	return cpt;
}
var inited = 0;
function init(fn){
	if(inited) return fn();	
	deftype("Env");
	deftype("Function")
	deftype("Block")
	deftype("Native")
	deftype("Undefined")
	deftype("String")
	deftype("Number")
	deftype("Context")	
	deftype("Exit");
	deffunc(function _vardump(obj){
		console.log("dump:");
		console.log(obj);
		this.fn();
	})
	deffunc(function _print(obj){
		if(obj.val == undefined || obj.val == null){
		}else{
			console.log(obj.val);			
		}
		this.fn();
	})
	deffunc(function _title(){
		console.log(this.env);
		this.fn();
	})


	deftype("Sentence");
	deftype("Word");		

	
	
	inited = 1;	
	fn();
}
