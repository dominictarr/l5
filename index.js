var fs = require('fs'), path = require('path')
var wasm = fs.readFileSync(path.join(__dirname, './l5.wasm'))
var codec = require('./codec')
var m = WebAssembly.Module(wasm)
var instance = WebAssembly.Instance(m, {console: {
  err_char: function (n) { console.log("LOG:char", n, String.fromCodePoint(n)) },
  err_ptr: function (n) { console.log("LOG:ptr", n, String.fromCodePoint(n)) },
  log: function (list) {
    console.log(codec.stringify(list))
  }
}})

var buffer = new Buffer(instance.exports.memory.buffer)

for(var k in instance.exports)
exports[k] = instance.exports[k]

exports.write = function (string) {
  var b = new Buffer(string, 'utf8')
  var str = exports.string(b.length)
  b.copy(buffer, str+4)
  return str
}

exports.read = function (str) {
  if(!exports.is_string(str)) throw new Error('not pointer to string:'+str)
  var len = exports.string_length(str)
  var b = new Buffer(len)
  return buffer.slice(str+4, str+len+4).toString('utf8')
}





