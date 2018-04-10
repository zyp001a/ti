var utils = require("./utils");
var db = utils.db;
var log = utils.log;
var fs = require("fs");
var path = require("path");
var at = require("./ast-tiprogl");
var cc = require("./concept");
var tree = require("./tree");
//brch - iddv
// :leafs :path :name :brch :brchs 
//leaf
// :path :name :brch :cpt

//individual
//env

//cpt
// :type :val :ref :id :leaf :prop
// type
//  :parent :criteria :defaults
// function
//  :argdef :block

module.exports = {
	ast2pcall: ast2pcall,
	pcall2ast: pcall2ast
}
function pcall2ast(pcall){
	var c = pcall[0];
	var e = pcall[1];
	switch(c){
	case "native":
	case "calls":
	case "call":
	case "cpt":		
	}
}
function ast2pcall(ast, brch, fn){
	var c = ast[0];
	var e = ast[1];
	switch(c){
	case "_id":
		return tree.get(brch, e, {leaf: ast[2]}, function(cpt){
			fn(['cpt', cpt]);
		});
	case "_idlocal":
		return fn();
	case "_calls":
		var pcalls = [];
		utils.eachsync(e, function(astsub, fnsub){
			ast2pcall(astsub, brch, function(pcall){
				pcalls.push(pcall);
				fnsub();
			})
		}, function(){
			return fn(["calls", pcalls]);
		})
		return;
	case "_call":
		var rtn = ['call', undefined, []];
		ast2pcall(e, brch, function(func){
			rtn[1] = func;
			utils.eachsync(ast[2], function(arg, fnsub){
				ast2pcall(arg, brch, function(argpcall){
					rtn[2].push(argpcall);
					fnsub();
				});
			}, function(){
				return fn(rtn);
			});
		});
		return;
	case "_function":
		var func = cc.newcpt("Function");
		ast2pcall(e[0], brch, function(block){
			var argdef = [];
			utils.eachsync(e[1], function(argd, fnsub){
				if(!argd[1]){					
					argdef.push(argd);
					return fnsub();
				}
				tree.get(brch, argd[1], {}, function(cpt){
					argdef.push([argd[0], cpt]);
					return fnsub();
				});
			}, function(){
				var rtndef;
				utils.ifsync(e[2], function(fnsub){
					tree.get(brch, e[2], {}, function(cpt){
						rtndef = cpt;
						fnsub();
					})
				}, function(){
					func.val = {
						block: block,
						argdef: argdef,
						rtndef: rtndef
					}
					fn(["cpt", func]);
				});
			})
		})
		return;
	case "_obj":
		//each obj key value do
		var cpt = cc.newcpt(e, ast[2]);
		return fn(['cpt', cpt]);
	case "_objstatic":
		return fn();		
	default:
		return
	}
}
