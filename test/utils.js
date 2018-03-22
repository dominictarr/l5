
var l = require('../')

var tape = require('tape')

var strings = [
  'foo', 'bar', 'foo_', 'foo-', '', '', 'bar?','ba', 'baar'
]

tape('string equals', function (t) {
  strings.forEach(function (a) {
    strings.forEach(function (b) {
      t.equal(l.string_equal(l.write(a), l.write(b)), +(a === b), 'compare:'+a+', '+b)
    })
  })
  t.end()
})


