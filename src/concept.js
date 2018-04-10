module.exports = {
	newcpt: newcpt,
	newenv: newenv,	
	newctx: newctx
}
function newcpt(type, val){
	// :type :val :rel :id :leaf
	var cpt = {
		type: type || "Cpt",
		val: val,
		rel: {},
		prop: {},
		//		id:
		__iscpt: 1
	}
	return cpt;
}
function newenv(env){
	var nenv = {
		parent: env
	}
	
	return nenv;
}
function newctx(brch, ctx){
	var nctx = {};
	if(!ctx) ctx = {};
	nctx.brch = brch;
	nctx.parent = ctx;
	nctx.desc = [];
	nctx.cpts = [];
	nctx.params = [];
	nctx.desccache = [];			
	var n = nctx.n = {
		when:0,
		where:0,
		who:0,
		how:undefined,
		agent:undefined
	};
	return nctx;
}
