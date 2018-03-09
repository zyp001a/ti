var utils = require("./utils");
var tiprogl2ast = require("./tiprogl-ast").tiprogl2ast;
var ast2tiprogl = require("./tiprogl-ast").ast2tiprogl;
var die = utils.die;
var log = utils.log;
var ap = require("./ast-pcall");
var pt = require("./pcall-tinatl");
module.exports = Ti;
function Ti(config){
	var self = this;
	var brch = config.brch || "default";
	self.brch = ap.newbrch(brch);
}
var inited = 0;
Ti.prototype.init = function(fn){
	if(inited) return fn();
	var self = this;
	ap.init(function(){
		ap.deftype("Sentence");
		ap.deftype("Word");		
		inited = 1;
		fn();
	});
}
Ti.prototype.run = function(str, config, fn){
	var self = this;
	var brch = ap.newbrch(config.brch || "main");
	var ctx = pt.newctx(brch);
	var envcpt = ap.newcpt("Env", {});
	ap.newleaf(brch, "$env", envcpt);
	var env = envcpt.val;	
	pt.tinatl2pcall(str, ctx, function(pcall){
		ap.call(pcall, env, function(res){
			fn(res);			
		})
	})
}
/*
Ti.prototype.err = function(str){
	self.emitter.emit("error", {
		text: str,
		line: __line2,
		function: __function
	});
}
*/
