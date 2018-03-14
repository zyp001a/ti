var jison = require("jison");
var fs = require("fs");
/*
key: {
 key: val
}
*/
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
			["{sp}\`(\\.|[^\\\`])*\`{sp}", 
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'STRING';"],			
			["{sp}\"(\\.|[^\\\"])*\"{sp}", 
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'STRING';"],
			["{sp}\'(\\.|[^\\\'])*\'{sp}",
       "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'STRING';"],
      ["{sp}{int}{frac}?{exp}?\\b{sp}",
			 "yytext = yytext.replace(/\\s/g, ''); return 'NUMBER';"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'WORD'"],
      ["{sp}:{sp}", "return ':'"],
      ["{sp}\{{sp2}", "return '{'"],
      ["{sp2}\}{sp}", "return '}'"]						
    ]
  },
  "start": "Start",
  "bnf": {
		"Start": [
			["Content", "return $$ = $1"]
		],
		"Content": [
			["Key : Value", "$$ = []; $$[$1] = $3;"],
			["Key", "$$ = []; $$[$1] = 1;"],			
			["Content Key", "$$ = $1; $$[$2] = 1"],
			["Content Key : Value", "$$ = $1; $$[$2] = $[4]"]
		],
		"Block": [
			["{ }", "$$ = []"],
			["{ Content }", "$$ = $2"]
		],
		"Key": [
			["NUMBER", "$$ = $1.toString()"],
			["WORD", "$$ = $1"]
		],
		"Value": [
			["NUMBER", "$$ = $1"],
			["STRING", "$$ = $1"],
			["WORD", "$$ = ['_word', $1]"],
			["Block", "$$ = $1"]
		]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/db-parser.js', code);

