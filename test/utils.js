
var l = require('../')

var tape = require('tape')

var strings = [
  'foo', 'bar', 'foo_', 'foo-', '', '', 'bar?','ba', 'baar'
]

tape('is_string', function (t) {
  t.equal(l.is_string(l.string(5)), 1)
  t.equal(l.is_cons(l.string(5)), 0)
  t.equal(l.is_string(l.cons(0, 0)), 0)
  t.equal(l.is_cons(l.cons(0, 0)), 1)

  t.end()
})

tape('string_length', function (t) {
  var s = l.string(5)
  console.log(s)
  t.equal(l.string_length(s), 5)

  t.end()

})

tape('string equals', function (t) {
  strings.forEach(function (a) {
    strings.forEach(function (b) {
      t.equal(l.string_equal(l.write(a), l.write(b)), +(a === b), 'compare:'+a+', '+b)
    })
  })
  t.end()
})





