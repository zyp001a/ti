var utils = require("./utils");
var ap = require("./ast-pcall");
function newctx(brch, ctx){
	var nctx = {};
	nctx.brch = brch;
	nctx.pctx = ctx;	
	nctx.freq = {};
	return nctx;
}
function maparch(ctx, words, fn){
	utils.eachsync(words, function(word, fnsub){
		ap.get(ctx.brch, word+"Arch",  {}, function(arch){
//			utils.freqadd(ctx.freq, arch.val);
			fnsub();
		});
	}, function(){
//		utils.freqsort(ctx.freq);		
		fn();
	});
}
function guessprecall(ctx, fn){
	fn()
}

function tinatl2pcall(str, ctx, fn){
	if(str.match(/;/)){
    var strs = str.split(/;/);
		var arr = [];
		utils.eachsync(strs, function(e, fnsub){
			self.tinatl2pcall(e, ctx, function(cpt){
				arr.push(cpt);
				fnsub();
			});
		}, function(){
			fn();	
		});
		return;
  }
	var cpt = ap.newcpt("Sentence");
	var words = str.split(/\s+/);
	var sctx = newctx(ctx.brch, ctx);
	maparch(sctx, words, function(){
		guessprecall(sctx, function(precall){
			fn(precall);
		});
	});
}
module.exports = {
	tinatl2pcall: tinatl2pcall,
	newctx: newctx
}
