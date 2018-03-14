var struct = require("../src/struct");
var fs = require("fs");
var str = fs.readFileSync(__dirname + "/struct.txt").toString();
var a = struct.parse(str);
console.log(a)
