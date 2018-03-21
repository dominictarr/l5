var fs = require('fs'), path = require('path')
var wasm = fs.readFileSync(path.join(__dirname, './l5.wasm'))

var m = WebAssembly.Module(wasm)
var instance = WebAssembly.Instance(m)

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

//var s1 = exports.write("***hello world***")
//var s2 = exports.write("more strings")
//console.log(exports.read(s1))
//console.log(exports.read(s2))
//var c2 = exports.cons(s2, 0)
//var c1 = exports.cons(s1, c2)
//
//console.log('c2', c2)
//console.log('c1', c1)
//console.log(exports.is_cons(c1))
//console.log(exports.head(c1))
//console.log(exports.read(exports.head(c1)))
//console.log(exports.read(exports.head(exports.tail(c1))))
//


