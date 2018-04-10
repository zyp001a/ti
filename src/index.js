
var utils = require("./utils");
var die = utils.die;
var log = utils.log;
var at = require("./ast-tiprogl");
var ap = require("./ast-pcall");
var pt = require("./pcall-tinatl");
var call = require("./call");
var cc = require("./concept");
var tree = require("./tree");
var init = require("./init");
module.exports = Ti;
function Ti(config){
	var self = this;
	var brch = config.brch || "main";
	self.brch = tree.newbrch(brch);
}
	/*
var inited = 0;
Ti.prototype.init = function(fn){
	if(inited) return fn();
	var self = this;
	ap.init(function(){
		inited = 1;
		fn();
	});
}

Ti.prototype.read = function(str, config, fn){
	var self = this;
	var brch = ap.newbrch(config.brch || "main");
	var ctx = pt.newctx(brch);
	var envcpt = ap.newcpt("Env", {context: ctx});
	ap.newleaf(brch, "$env", envcpt);
	var env = envcpt.val;
	var t = pt.str2tinatl(str);
	pt.tinatl2pcall(t, ctx, function(pcall){
		ap.call(pcall, env, function(res){
			fn(ctx);
		})
	})	
}
*/
Ti.prototype.execnatl = function(str, fn){
	var self = this;
	var brch = self.brch;
	var ctx = cc.newctx(brch);
	var envcpt = cc.newcpt("Env", {context: ctx});
	tree.newleaf(brch, "$env", envcpt);
	var env = envcpt.val;
	var t = pt.str2tinatl(str);
	init.init(function(){
		pt.tinatl2pcall(t, ctx, function(pcall){
			call.call(pcall, env, function(res){
				fn(res);			
			})
		});
	})
}
Ti.prototype.execprogl = function(str, fn){
	var self = this;
	var brch = self.brch;	
	var ast = at.tiprogl2ast(str);
	var envcpt = cc.newcpt("Env", {});
	tree.newleaf(brch, "$env", envcpt);
	var env = envcpt.val;
	init.init(function(){
		ap.ast2pcall(ast, brch, function(pcall){
			call.call(pcall, env, fn);
		});
	});
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
