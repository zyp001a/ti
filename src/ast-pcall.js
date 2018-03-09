var utils = require("./utils");
var db = utils.db;
var log = utils.log;
var fs = require("fs");
var path = require("path");
var tiprogl2ast = require("./tiprogl-ast").tiprogl2ast;
var ast2tiprogl = require("./tiprogl-ast").ast2tiprogl;

//brch - iddv
// :leafs :path :name :brch :brchs 
//leaf
// :path :name :brch :cpt

//individual
//env

//cpt
// :type :val :ref :id :leaf
// type
//  :parent :criteria :defaults
// function
//  :argdef :block

var rootbrch = {
	path: ".",
	name: "",
	leafs: {},
	brch: undefined,
	brchs: {}
}
module.exports = {
	root: rootbrch,
	setdb: setdb,
	newbrch: newbrch,
	newleaf: newleaf,
	newcpt: newcpt,
	get: get,
	set: set,
	init: init,
	call: call,
	ast2pcall: ast2pcall,
	pcall2ast: pcall2ast,
	exec: exec,
	deftype: deftype,
	deffunc: deffunc,
	convert: convert
}
var types = {};
function deftype(p, ex){
	var cpt = types[p] = newcpt("TYPE");
	newleaf(rootbrch, p, cpt);
	if(ex)
		ex(cpt);
}
function deffunc(func, ex, makefunc){
	var argnum = func.length;
	var cpt = newcpt("Function");
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
	newleaf(rootbrch, tname, cpt);
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
	inited = 1;	
	fn();
}
function setdb(_db){
	db = _db;
}
function newbrch(name, from){
	if(!from) from = rootbrch;
	if(!name.match("/")){
		return {
			path: path.join(from.path, name),
			name: name,
			leafs: {},
			brch: from,
			brchs: {}
		}
	}
	var names = name.split("/");
	var p = from;
	for(var i in names){
		p = newbrch(names[i], p);
	}
	return p;
}
function newleaf(brch, name, cpt){	
	var leaf = {
		path: path.join(brch.path, name),
		name: name,
		brch: brch
	}
	if(!cpt){
		cpt = newcpt();
	}
	cpt.leaf = leaf;
	leaf.cpt = cpt;
	brch.leafs[name] = leaf;
	return leaf;
}
function newcpt(type, val){
	// :type :val :rel :id :leaf
	var cpt = {
		type: type || "Cpt",
		val: val,
		rel: {},
		//		id:
		__iscpt: 1
	}
	return cpt;
}
function getnotnewleaf(brch, key, config, fn){
	if(!config.notnew){
		var leaf = newleaf(brch, key);
		return fn(getleaf(leaf, config));
	}else{
		return fn();
	}
}
function getleaf(leaf, config){
	if(config.leaf){
		config.leaf --;
		return getleaf(leaf.cpt.val, config);
	}
	return leaf.cpt;
}
function pcpt2cpt(pcpt, brch, key, fn){
	var keys = Object.keys(pcpt);
	utils.eachsync(keys, function(k, fnsub){
		var v = pcpt[k];
		if(typeof v == "object"){
			if(v[0] == "_word"){
				if(v[1] == key){
					pcpt[k] = pcpt;
					fnsub();
				}else{
					get(brch, v[1], {}, function(subcpt){
						pcpt[k] = subcpt;
						fnsub();
					})
				}					
			}else{
				pcpt2cpt(v, brch, key, function(subpcpt){
					pcpt[k] = subpcpt;
					fnsub();					
				});
			}
		}else{
			fnsub();
		}
	}, function(){
		return fn(pcpt);
	});
}
//leaf local notnew
function get(brch, key, config, fn){
	if(!config) config = {};
	var leaf = brch.leafs[key];
	if(leaf) return fn(getleaf(leaf, config));
	utils.ifsync(db, function(fnsub){
		db.get(brch.path+"/"+key, function(pcpt){
			if(pcpt){
				pcpt2cpt(pcpt, brch, key, function(cpt){
					if(!cpt.type) cpt.type = "Cpt";
					if(!cpt.rel) cpt.rel = {};		
					cpt.__iscpt = 1;							
					leaf = newleaf(brch, key, cpt);
					fnsub(leaf);
				});
			}else{
				fnsub();
			}
		});
	}, function(leaf){
		if(leaf) return fn(getleaf(leaf, config));
		if(config.local) return getnotnewleaf(brch, key, config, fn);
		utils.eachsync(Object.values(brch.brchs), function(link, fnsub){
			get(link, key, config, fnsub);
		}, function(res){
			if(res) return fn(res);
			utils.ifsync(brch.brch, function(fnsub){
				get(brch.brch, key, config, fnsub);
			}, function(res){
				if(res) return fn(res);
				return getnotnewleaf(brch, key, config, fn);
			})
		})
	})
}
function set(ns, key, val, config, fn){
}

function exec(str, brch, fn){
	var ast = tiprogl2ast(str);
	var envcpt = newcpt("Env", {});
	newleaf(brch, "$env", envcpt);
	var env = envcpt.val;
	ast2pcall(ast, brch, function(pcall){
		call(pcall, env, fn);
	});
}
function raw2cpt(e){
	if((typeof e) == "object" && ("___iscpt" in e)) return e;
	if(e === undefined){
		return newcpt("Undefined");
	}else if(typeof e == "string"){
		return newcpt("String", e);
	}else if(typeof e == "number"){
		return newcpt("Number", e);		
	}else{
		return newcpt("Cpt", e);		
	}
}
function convert(cpt, typec, fn){
	if(typec == "Cpt") return fn(cpt);
	
	fn(cpt);
}
function call(pcall, env, fn){
	var c = pcall[0];
	var e = pcall[1];
	switch(c){
	case "native":
		return e.apply({env: env, fn: function(rtn){
			fn(raw2cpt(rtn))
		}}, env.$args);
	case "calls":
		utils.eachsync(e, function(tcall, fnsub){
			call(tcall, env, function(rtn){
				//if return TODO
				fnsub(rtn);				
			})
		}, function(rtn){
			fn(rtn);
		});
		return;
	case "call":
		call(e, env, function(func){
			var nenv = newenv(env);
			var args = [];
			nenv.$args = args;
			var i = 0;
			utils.eachsync(pcall[2], function(ee, fnsub){
				call(ee, env, function(rtn){
					var argdef = func.val.argdef[i];
					convert(rtn, argdef.type, function(crtn){
						args.push(crtn);
						nenv[argdef.id] = crtn;
						fnsub();
					});
				});
			}, function(){
				call(func.val.block, nenv, function(rtn){
					//check rtn type TODO
					fn(rtn);
				})
			});
		});
		return;
	case "cpt":
		return fn(e);
	default:
		return fn()
	}
};
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
		return get(brch, e, {leaf: ast[2]}, function(cpt){
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
		var func = newcpt("Function");
		ast2pcall(e[0], brch, function(block){
			var argdef = [];
			utils.eachsync(e[1], function(argd, fnsub){
				if(!argd[1]){					
					argdef.push(argd);
					return fnsub();
				}
				get(brch, argd[1], {}, function(cpt){
					argdef.push([argd[0], cpt]);
					return fnsub();
				});
			}, function(){
				var rtndef;
				utils.ifsync(e[2], function(fnsub){
					get(brch, e[2], {}, function(cpt){
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
		var cpt = newcpt(e, ast[2]);
		return fn(['cpt', cpt]);
	case "_objstatic":
		return fn();		
	default:
		return
	}
}
function newenv(env){
	var nenv = {
		$parent: env
	}
	
	return nenv;
}
