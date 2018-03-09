var jison = require("jison");
var fs = require("fs");
var grammar = {
  "lex": {
    "macros": {
      "digit": "[0-9]",
			"letter": "[a-zA-Z_]",
      "esc": "\\\\",
      "int": "-?(?:[0-9]|[1-9][0-9]+)",
      "exp": "(?:[eE][-+]?[0-9]+)",
      "frac": "(?:\\.[0-9]+)",
			"sp": "[ \\t]*",
			"sp2": "[ \\t\\n\\r]*"
    },
    "rules": [
			["\\/\\*[\\S\\s]*\\*\\/", "return;"],//COMMENT
			["\\#[^\\n\\r]+[\\n\\r]*", "return;"],//COMMENT
			["\\\/\\\/[^\\n\\r]+[\\n\\r]*", "return;"],//COMMENT
			["{sp}\"(\\.|[^\\\"])*\"{sp}", 
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'STRING';"],
			["{sp}\'(\\.|[^\\\'])*\'{sp}",
       "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'STRING';"],
      ["{sp}\\\\[\\r\\n;]+{sp}", "return"],//allow \ at end of line
      ["{sp}{int}{frac}?{exp}?\\b{sp}",
			 "yytext = yytext.replace(/\\s/g, ''); return 'NUMBER';"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'ID'"],
			["{sp}\\${digit}*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'ID'"],
      ["{sp}\\.{sp}", "return '.'"],
			["{sp}\\=\\>{sp2}", "return '=>'"],			
      ["{sp}\\({sp2}", "return '('"],
      ["{sp2}\\){sp}", "return ')'"],
      ["{sp}\\[{sp2}", "return '['"],
      ["{sp2}\\]{sp}", "return ']'"],
      ["{sp}\\{{sp2}", "return '{'"],
      ["{sp2}\\}{sp}", "return '}'"],
			["{sp}\\#\\!{sp2}", "return '#!'"],			
			["{sp}\\=\\~{sp2}", "return '=~'"],
			["{sp}\\=\\?{sp2}", "return '=?'"],
			["{sp}\\=\\:{sp2}", "return '=:'"],
			["{sp}\\>\\={sp2}", "return '>='"],
			["{sp}\\<\\={sp2}", "return '<='"],
			["{sp}\\=\\={sp2}", "return '=='"],
			["{sp}\\!\\={sp2}", "return '!='"],
			["{sp}\\+\\={sp2}", "return '+='"],
			["{sp}\\-\\={sp2}", "return '-='"],
			["{sp}\\*\\={sp2}", "return '*='"],
			["{sp}\\/\\={sp2}", "return '/='"],
			["{sp}\\|\\|{sp2}", "return '||'"],
			["{sp}\\&\\&{sp2}", "return '&&'"],
			["{sp}\\:\\:{sp2}", "return '::'"],
      ["{sp}\\>\\>{sp2}", "return '>>'"],
			["{sp}\\<\\<{sp2}", "return '<<'"],
      ["{sp}\\>{sp2}", "return '>'"],
      ["{sp}\\<{sp2}", "return '<'"],
      ["{sp}\\&{sp}", "return '&'"],
      ["{sp}\\@{sp}", "return '@'"],
      ["{sp}\\|{sp}", "return '|'"],
			["{sp}\\!{sp}", "return '!'"],
			["{sp}={sp}", "return '='"],
			["{sp}\\+{sp2}", "return '+'"],
			["{sp}\\-{sp2}", "return '-'"],
			["{sp}\\*{sp2}", "return '*'"],
			["{sp}\\/{sp2}", "return '/'"],
			["{sp}\\%{sp}", "return '%'"],
			["{sp}\\^{sp}", "return '^'"],
			["{sp}\\.{sp2}", "return '.'"],
			["{sp}\\:{sp2}", "return ':'"],
      ["{sp},{sp2}", "return ','"],
      ["{sp}\\~{sp2}", "return '~'"],
      ["{sp}[\\r\\n;]+{sp}", "return ';'"],
			["{sp}\\_{sp}", "return 'NULL'"]
    ]
  },
	"operators": [
    ["right", "=", "+=", "-=", "*=", "/=", ":="],
		["left", "<", ">", ">=", "<=", "==", "!="],
		["left", "=~"],
		["left", ","],
    ["left", "||"],
    ["left", "&&"],
    ["left", "+", "-"],
    ["left", "*", "/", "%"],
    ["right", "&", "|", "@", "~", "%"],
    ["right", "!"],
		["left", ".", ":", "=>"]
	],
  "start": "Start",
  "bnf": {
		"Start": [
			["Calls", "return $$ = ['_calls', $1]"]
		],
		"IdTarget": [
			["ID", "$$ = ['_id', $1]"],
			["@ ID", "$$ = ['_idlocal', $2]"]
		],
		"Id": [
			["& Id", "$$ = $2; $2[2]++;"],
			["IdTarget", "$$ = $1; $1[2] = 0"]
		],
		"Element": [
			["STRING", "$$ = ['_obj', 'String', $1]"],
			["NUMBER", "$$ = ['_obj', 'Number', Number($1)]"],
			["NULL", "$$ = ['_obj', 'Null']"],
			["Id", "$$ = $1"],
			["Function", "$$ = $1"],
			["Obj", "$$ = $1"],
			["Block", "$$ = ['_obj', 'Block', $1]"],
			["Call", "$$ = $1"]
		],
		"Call": [
			["Element ( )", "$$ = ['_call', $1, []];"],
			["Element ( Exps )", "$$ = ['_call', $1, $3];"]
		],
		"Return": [
			["~ Exp", "$$ = ['_call', ['_id', 'return'], $2]"]
		],
		"Calls": [
			["Call ;", "$$ = [$1]"],
			["AssignOp ;", "$$ = [$1]"],
			["Return ;", "$$ = [$1]"],			
			["Calls Call ;", "$$ = $1; $1.push($2)"],
			["Calls AssignOp ;", "$$ = $1; $1.push($2)"],
			["Calls Return ;", "$$ = $1; $1.push($2)"]
		],
		"Exp": [
			["Element", "$$ = $1"],
			["Op", "$$ = $1"],
			["( Exp )", "$$ = $1"]
		],
		"Exps": [
			["Exp", "$$ = [$1]"],
			["Exps , Exp", "$$ = $1; $1.push($2)"]
		],
		"Key": [
			["ID", "$$ = ['_obj', 'String', $1]"],
			["STRING", "$$ = ['_obj', 'String', $1]"],
			["NUMBER", "$$ = ['_obj', 'Number', $1]"],
			["( Exp )", "$$ = $2"]
		],
		"KeyColon": [
			["ID :", "$$ = ['_obj', 'String', $1]"],
			["STRING :", "$$ = ['_obj', 'String', $1]"],
			["NUMBER :", "$$ = ['_obj', 'Number', $1]"],
			["( Exp ) :", "$$ = $2"]
		],
		"AssignOp": [
			["Exp = Exp", "$$ = ['_call', ['_id', 'assign'], [$3, $1]]"],
			["Exp += Exp", "$$ = ['_call', ['_id', 'assign'], [ ['_call', ['_id', 'plus'], [$1, $3]], $1]]"]			
		],
		"GetOp": [
			["Element . Key", "$$ = ['_call', ['_id', 'get'], [$1, $3]]"],
			["GetOp . Key", "$$ = ['_call', ['_id', 'get'], [$1, $3]]"]
		],
		"Op": [
			["! Exp", "$$ = ['_call', ['_id', 'not'], [$2]]"],
			["Exp + Exp", "$$ = ['_call', ['_id', 'plus'], [$1, $3]]"],
			["Exp - Exp", "$$ = ['_call', ['_id', 'minus'], [$1, $3]]"],
			["Exp * Exp", "$$ = ['_call', ['_id', 'times'], [$1, $3]]"],
			["Exp / Exp", "$$ = ['_call', ['_id', 'obelus'], [$1, $3]]"],
			["Exp >= Exp", "$$ = ['_call', ['_id', 'ge'], [$1, $3]]"],
			["Exp <= Exp", "$$ = ['_call', ['_id', 'le'], [$1, $3]]"],
			["Exp == Exp", "$$ = ['_call', ['_id', 'eq'], [$1, $3]]"],
			["Exp != Exp", "$$ = ['_call', ['_id', 'ne'], [$1, $3]]"],
			["Exp > Exp", "$$ = ['_call', ['_id', 'gt'], [$1, $3]]"],
			["Exp < Exp", "$$ = ['_call', ['_id', 'lt'], [$1, $3]]"],
			["GetOp", "$$ = $1"],
			["AssignOp", "$$ = $1"]			
		],
		"Block": [
			["{ }", "$$= ['_calls', []]"],
			["{ Calls }", "$$ = ['_calls', $2]"]
		],
		"Function": [
			["=> ( ) Block", "$$ = ['_function', [$4, []]]"],
			["=> ( Args ) Block", "$$ = ['_function', [$5, $3]]"],
			["=> ID ( ) Block", "$$ = ['_function', [$5, [], $2]]"],
			["=> ID ( Args ) Block", "$$ = ['_function', [$6, $4, $2]]"]
		],
		"Arg": [
			["ID", "$$ = [$1]"],
			["ID : ID", "$$ = [$1, $3]"]		
		],
    "Args": [
      ["Arg", "$$ = [$1]"],

			["Args , Arg", "$$ = $1, $1.push($3)"]
    ],
		"IDs": [
			["ID", "$$ = [$1]"],
			["IDs , ID", "$$ = $1; $1.push($3);"]			
		],
		"Obj": [
			["ObjRaw", "$$ = $1"],
			["ObjRaw : IDs", "$$ = $1; $1[3] = $3"],
		],
		"ObjRaw": [
			["[ ]", "$$ = ['_obj', 'Obj', {}]"],
			["[ ObjElements ]", "$$ = ['_obj', 'Obj', $2.value]"],
			["ID [ ]", "$$ = ['_obj', $1, {}]"],			
			["ID [ ObjElements ]", "$$ = ['_obj', $1, $3.value]"]			
		],
		"ObjElements": [
      ["Exp", "$$ = {value:[[0, $1]], i:1}"],
      ["KeyColon Exp", "$$ = {value:[[$1, $2]], i:1};"],
      ["ObjElements , Exp", "$$ = $1, $1.value.push([$1.i++, $3]);"],
      ["ObjElements , KeyColon Exp", "$$ = $1, $1.value.push([$3, $4]);"]
		]
		/*		
		"KeyStaticColon": [
			["ID :", "$$ = $1"],
			["STRING :", "$$ = $1"],
			["NUMBER :", "$$ = $1"]
		],
		"ValStatic": [
			["ID", "$$ = ['id', $1]"],
			["STRING", "$$ = ['str', $1]"],
			["NUMBER", "$$ = ['num', $1]"],
			["ObjStatic", "$$ = ['obj', $1]"],
			["Block", "$$ = ['blk', $1]"]			
		],
		"ObjStaticExt": [
			["~ ObjStatic", "$$ = ['_objstatic', $1]"]
		],
		"ObjStatic": [
			["[ ]", "$$ = {}"],
			["[ ObjStaticElements ]", "$$ = $2"]
		],
		"ObjStaticElements": [
      ["KeyStaticColon ValStatic", "$$ = {}; $$[$1] = $2;"],
      ["ObjStaticElements KeyStaticColon ValStatic", "$$ = $1; $1[$2] = $3;"]
		]
*/
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/tiprogl-parser.js', code);

