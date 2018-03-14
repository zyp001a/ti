var jison = require("jison");
var fs = require("fs");
var grammar = {
  "lex": {
    "macros": {
      "digit": "[0-9]",
			"letter": "[a-zA-Z_]",
      "esc": "\\\\",
      "int": "-?(?:[0-9]+)",
      "exp": "(?:[eE][-+]?[0-9]+)",
      "frac": "(?:\\.[0-9]+)",
			"sp": "[ \\t]*",
			"sp2": "[ \\t\\n\\r]*"
    },
    "rules": [
			["{sp}\"(\\.|[^\\\"])*\"{sp}", 
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'QUOTE';"],
			["{sp}\'(\\.|[^\\\'])*\'{sp}",
       "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'QUOTE';"],
			["{sp}\`(\\.|[^\\\`])*\`{sp}",
       "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'SUPP';"],
      ["{sp}{int}{frac}?{exp}?\\b{sp}",
			 "yytext = yytext.replace(/\\s/g, ''); return 'NUMBER';"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'WORD'"],
			["{sp}{digit}+{letter}{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'CAL'"],
      ["{sp};+{sp}", "return ';'"],
      ["{sp}\{{sp2}", "return '{'"],
      ["{sp2}\}{sp}", "return '}'"]
    ]
  },
  "start": "Start",
  "bnf": {
		"Start": [
			["P", "return $$ = $1"],
			["P ;", "$1[$1.length-1].p = 1; return $$ = $1;"],
		],
		"P": [
			["S", "$$ = [$1]"],
			["P ; S", "$$ = $1; $1[$1.length-1].p = 1; $1.push($3)"],
		],
		"S": [
			["W", "$$ = {s:[$1]}"],
			["S W", "$$ = $1; $1.s.push($2)"]
		],
		"W": [
			["WE", "$$ = $1"],
			["{ W }", "$$ = ['set', $2]"]
		],		
		"WE": [
			["SUPP", "$$ = ['supp', $1]"],
			["QUOTE", "$$ = ['quote', $1]"],
			["NUMBER", "$$ = ['number', $1]"],
			["WORD", "$$ = ['word', $1]"],
			["CAL", "$$ = ['cal', $1]"]
		]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/tinatl-parser.js', code);

