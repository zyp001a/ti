var path = require("path");
var utils = require("./utils");
var cc = require("./concept");
var db = utils.db;
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
	get: get,
	set: set
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
		cpt = cc.newcpt();
	}
	cpt.leaf = leaf;
	leaf.cpt = cpt;
	brch.leafs[name] = leaf;
	return leaf;
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
					if(!cpt.prop) cpt.prop = {};							
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
