var parser = require("./tiprogl-parser");
module.exports = {
	tiprogl2ast: read,
	ast2tiprogl: ast2str
}
function read(str){
	return parser.parse(str);
}
function ast2str(ast){
	var k = ast[0];
	var e = ast[1];
	switch(k){
	case "_calls":
		var str = "";
		for(var i in e){
			str += ast2str(e[i]) + ";\n";
		}
		return str;
	case "_call":
		if(e[0] == "_id"){
			var func;			
			var left = ast2str(ast[2][0]);
			var right = ast[2][1]?ast2str(ast[2][1]):"";
			var notop = 0;
			switch(e[1]){
			case "plus":
				func = left + "+" + right;
				break;
			case "assign":
				func = right + "=" + left;
				break;				
			default:
				notop = 1;
			}
			if(!notop)
				return func;
		}
		return ast2str(e) + "(" + ")";
	case "_id":
		if(ast[2] == "addr")
			return "&" +e;
		return e;
	case "_idlocal":
		if(ast[2] == "addr")
			return "&@" +e;		
		return "@"+e;
	case "_ast":
		var arg = ast[2];
		switch(e){
		case "Number":
			return String(arg);
		case "String":
			return arg;
		case "Null":
			return "_";
		case "Block":
			return "{}";
		case "Function":
			return "=> (";
		case "Ast":
			return "[]";
		default:
			console.error("Error: ti-lang . _ast");
			console.error(ast);			
		}
	default:
		console.error("Error: ti-lang . ast2str");
		console.error(ast);
	}
}
