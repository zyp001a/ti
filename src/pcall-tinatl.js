var utils = require("./utils");
var ap = require("./ast-pcall");
var parser = require("./tinatl-parser");
var log = utils.log;
var die = utils.die;
/*
.arch
arch: 
 
*/

function newctx(brch, ctx){
	var nctx = {};
	if(!ctx) ctx = {};
	nctx.brch = brch;
	nctx.pctx = ctx;
	nctx.desc = [];
	nctx.cpts = [];
	nctx.params = [];		
	var n = nctx.n = {
		when:0,
		where:0,
		who:0,
		how:undefined,
		agent:undefined
	};
	return nctx;
}
function _addcpts(ctx, arch, desccache){
	if(arch.arch && arch.arch.desc){
		desccache.push(arch);					
	}else{
		arch.desccache = desccache;
		desccache = [];
		ctx.cpts.push(arch);
	}
}
function maparch(ctx, words, fn){
	var desccache = [];
	utils.eachsync(words, function(word, fnsub){
		var type = word[0];
		var val = word[1];
		switch(type){
		case "word":			
			ap.get(ctx.brch, val+".arch",  {}, function(arch){
				//			utils.freqadd(ctx.freq, arch.val);
				_addcpts(ctx, arch, desccache);
				fnsub();
			});
			return;
		case "quote":
		case "number":
			ap.get(ctx.brch, "number.arch",  {}, function(arch){
				var narch = ap.newcpt("Number", val);
				narch.arch = arch.arch;
				_addcpts(ctx, narch, desccache);
				fnsub();
			});
			return;
		case "cal":
			break;
		default:
			die(word)
		}
	}, function(){
		ctx.desc = desccache;
//		if(desccache.length){
			//desc ctx
//		}
//		utils.freqsort(ctx.freq);		
		fn();
	});
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
			ap.convert(parcpt, type, function(tcpt){
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
		})
	}, function(){
		fn(['call', ['cpt',ctx.n.how], pcallargs]);
	})
}

function tinatl2pcall(str, ctx, fn){
	var parsed = parser.parse(str);
	var calls = [];
	utils.eachsync(parsed.s, function(e, fnsub){
		var sctx = newctx(ctx.brch, ctx);
		maparch(sctx, e, function(){ //ctx.cpts
			mapsketch(sctx, function(){//ctx.params ctx.n
				mappcall(sctx, function(pcall){
					if(pcall)
						calls.push(pcall);
					if(sctx.desccache.length){
						//add calls to ctx
					}
					fnsub();
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
module.exports = {
	tinatl2pcall: tinatl2pcall,
	newctx: newctx
}
