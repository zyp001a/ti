var utils = require("./utils");
var ap = require("./ast-pcall");
var parser = require("./tinatl-parser");
var log = utils.log;
var die = utils.die;
var cc = require("./concept");
var tree = require("./tree");
var call = require("./call");
module.exports = {
	str2tinatl: parser.parse,
	tinatl2pcall: tinatl2pcall
}

/*
.arch
arch: 
 
*/

function _addcpts(ctx, arch){
	if(arch.arch && arch.arch.desc){
		ctx.desccache.push(arch);					
	}else{
		arch.desccache = ctx.desccache;
		ctx.desccache = [];
		ctx.cpts.push(arch);
	}
}
function readword(ctx, word, fn){
	var type = word[0];
	var val = word[1];
	switch(type){
	case "word":
		tree.get(ctx.brch, val+".arch",  {}, function(arch){
			//			utils.freqadd(ctx.freq, arch.val);
			_addcpts(ctx, arch);
			fn();
		});
		return;
	case "quote":
	case "number":
		tree.get(ctx.brch, "number.arch",  {}, function(arch){
			var narch = cc.newcpt("Number", val);
			narch.arch = arch.arch;
			_addcpts(ctx, narch);
			fn();
		});
		return;
	case "cal":
		break;
	case "supp":
		break;
	case "set":
		break;			
	default:
		die(word)
	}
	fn();
}

function mapsketch(ctx, fn){
	var ts = Object.keys(ctx.n);
	//get description
	//get main content
	utils.eachsync(Object.keys(ctx.cpts), function(i, fnsub1){	
		var arch = ctx.cpts[i];
		var got = 0;
		utils.eachsync(Object.keys(arch.arch || {}), function(k, fnsub2){
			var cpt = arch.arch[k];
			var ti = 0;
			utils.eachsync(ts, function(t, fnsub){
				if(t == k){
					ts.splice(ti, 1);
					ctx.n[t] = cpt;
					fnsub(1);
				}else{
					ti++;
					fnsub();
				}
			}, function(subgot){
				if(subgot)
					got = 1;
				fnsub2();
			});
		}, function(){
			if(!got){
				ctx.params.push(ctx.cpts[i]);
			}
			fnsub1();
		})
	}, function(){
		//match pcall
		//ctx.n.how, ctx.params -> pcall
		fn();
	})
}
function mappcall(ctx, fn){
	if(!ctx.n.how) return fn();
	var argdef = ctx.n.how.val.argdef;
	var pcallargs = [];
	utils.eachsync(Object.keys(argdef), function(ai, fnsub1){	
		var type = argdef[ai][1];
		var pi = 0;
		utils.eachsync(ctx.params, function(parcpt, fnsub){
			call.convert(parcpt, type, function(tcpt){
				if(tcpt){
					pcallargs[ai] = ['cpt', tcpt];
					ctx.params.splice(pi, 1);
					fnsub(1);
				}else{
					pi ++;
					fnsub();
				}					
			});
		}, function(){
			fnsub1();
		});
	}, function(){
		fn(['call', ['cpt',ctx.n.how], pcallargs]);
	});
}

function tinatl2pcall(parsed, ctx, fn){
	/*
[
{ s: [ [ 'word', 'print' ], [ 'number', '1' ] ], p: 1 }
]
*/
	var calls = [];
	utils.eachsync(parsed, function(sent, fnsub1){
		var sctx = cc.newctx(ctx.brch, ctx);		
		utils.eachsync(sent.s, function(e, fnsub){
			readword(sctx, e, function(){ //ctx.cpts
				fnsub()
			});
		}, function(){
			mapsketch(sctx, function(){//ctx.params ctx.n
				mappcall(sctx, function(pcall){
					if(pcall)
						calls.push(pcall);
					if(sctx.desccache.length){
						//add calls to ctx
					}
					fnsub1();
				});
			});
		});
	}, function(){
		if(calls.length == 1)
			fn(calls[0]);
		else
			fn(["calls", calls]);
	});
}
