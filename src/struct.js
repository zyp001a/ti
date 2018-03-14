var nparse = require("./tinatl-parser").parse;
function parse(text){
	var a = text.split(/[\n\r]+/);
	a.forEach(function(e){
		e = e.replace(/e\.g\./g, "eg");
		e = e.replace(/etc\./g, "etc");
		//DATE TODO
		e = e.replace(/([A-Za-z0-9])\/([A-Za-z0-9])/g, "$1 or $2");
		e = e.replace(/[\(\[\{\)\]\}\/]/g, "`");
		e = e.replace(/\.([A-Za-z0-9])/g, "$1");
		e = e.replace(/[\!\！\?\？]$/g, "");		
		e = e.replace(/[\.\。\!\！\?\？]/g, ";");
		//special chars TODO
		e = e.replace(/[-]/g, "");
		e = e.replace(/[^A-Za-z0-9_\; `]/g, " ");
		e = e.replace(/\s+/g, " ");
		e = e.replace(/` ?`/g, "");
		e = e.replace(/^\s+/g, "");
		e = e.replace(/([^;]+;)\s*(`[^`]+`)/g, "$2 $1");
		if(e.length == 0) return;
		console.log(e);		
		var str = nparse(e);
		if(!str.length) return;
		var s = str[str.length -1];
		if(s.p || str.length > 1){
			console.log("C")
		}else{
			console.log("T")
		}
		//get shortest T before C -> title, get T before Cs, T not (long and first)
		for(var i in str){
			var s = str[i];
//			console.log(str[i].s.length)
		}
	});
	
}
//UN: ad or head or foot, all unrelated content
//TITLE: begin, independent, related
//INDEX: contain subtitle, independent
//SUBTITLE: short, repeat
//CONTENT: after sub
module.exports = {
	parse: parse
}
