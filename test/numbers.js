var tape = require('tape')
var l = require('../')
var codec = require('../codec')

tape('integers', function (t) {

  var three = l.int(3)
  t.equal(l.int_value(three), 3)

  var five = l.int(5)
  t.equal(l.int_value(five), 5)
  var nums = l.cons(three, l.cons(five, 0))
  t.equal(l.int_value(l.add(nums)), 8)
  t.equal(l.int_value(l.add(l.parse(l.write('(3 5)')))), 8, 'add 3+5')

  t.equal(codec.stringify(nums), '(3 5)')
  t.equal(codec.stringify(l.parse(l.write(codec.stringify(nums)))), '(3 5)')
  t.equal(l.int_value(l.add(l.parse(l.write(codec.stringify(nums))))), 8, 'add 3+5')
  t.equal(l.int_value(l.add(l.parse(l.write('(33 55)')))), 88, 'add 33+55')

  t.end()
})

