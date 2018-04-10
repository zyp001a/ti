var u = require("./utils");
var cc = require("./concept");
module.exports = {
	call: call,
	convert: convert
}
function call(pcall, env, fn){
	var c = pcall[0];
	var e = pcall[1];
	switch(c){
	case "native":
		//record history
		return e.apply({env: env, fn: function(rtn){
			fn(raw2cpt(rtn))
		}}, env.args);
	case "calls":
		u.eachsync(e, function(tcall, fnsub){
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
			var nenv = cc.newenv(env);
			var args = [];
			nenv.args = args;
			var i = 0;
			u.eachsync(pcall[2], function(ee, fnsub){
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
function raw2cpt(e){
	if((typeof e) == "object" && ("___iscpt" in e)) return e;
	if(e === undefined){
		return cc.newcpt("Undefined");
	}else if(typeof e == "string"){
		return cc.newcpt("String", e);
	}else if(typeof e == "number"){
		return cc.newcpt("Number", e);		
	}else{
		return cc.newcpt("Cpt", e);		
	}
}
function convert(cpt, typec, fn){
	if(typec == "Cpt") return fn(cpt);
//	TODO
	fn(cpt);
}
