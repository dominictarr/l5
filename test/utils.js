
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

tape('string eq char', function (t) {
  var chars = 'ABDCefgh1234567890 ~!@#$%^&*(){}+?/=[]'
  for(var i = 0; i < chars.length; i++) {
    var s = l.write(chars[i])
    t.equal(l.is_string(s), 1,'(is_string '+chars[i]+')')
    t.equal(l.string_length(s), 1, '(string_length '+chars[i]+')')
    t.equal(l.string_eq_char(s, chars[i].codePointAt(0)), 1, '(string_eq_char '+chars[i]+')')
    t.equal(l.string_eq_char(s, (chars[i-1] || '').codePointAt(0)), 0, '(string_eq_char '+chars[i]+')')
  }
  t.end()
})

tape('string equals', function (t) {
  strings.forEach(function (a) {
    strings.forEach(function (b) {
      var _a = l.write(a)
      t.equal(_a & 3, 0, 'assert that strings are aligned to 4th byte')
      t.equal(l.string_equal(_a, l.write(b)), +(a === b), 'compare:'+a+', '+b)
    })
  })
  t.end()
})



