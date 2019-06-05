
var l = require('../')
var tape = require('tape')
var codec = require('../codec')

//var i = l5.parse(l5.write("("))
//console.log(i)
//console.log(codec.stringify(i))

var values = [
  '1',
  '12',
  '123'
]

tape('simple', function (t) {
  values.forEach(function (v) {
    var ast = l.parse(l.write(v))
    t.equal(l.int_value(ast), +v)
    t.equal(codec.stringify(ast), v)
  })
  t.end()

})





