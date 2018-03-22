

var tape = require('tape')
var l = require('../')

tape('integers', function (t) {

  var three = l.int(3)
  t.equal(l.int_value(three), 3)

  var five = l.int(5)
  t.equal(l.int_value(five), 5)
  t.equal(l.int_value(l.add(l.cons(three, l.cons(five, 0)))), 8)

  t.end()
})



