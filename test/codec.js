

var codec = require('../codec')
var l = require('../')

function each (list, iter) {
  if(!list) return
  iter(l.head(list))
  each(l.tail(list), iter)
}

function toArrays (list) {
  var a = []
  each(list, function (e) {
    if('string' === typeof e)
      a.push(e)
    else
      a.push(toArrays(e))
  })
  return a
}

function toCons (list) {
  if(list === 0) return null
  if(l.is_string(list)) return l.read(list)
  return {head: toCons(l.head(list)), tail: toCons(l.tail(list))}
}

var src2ast = [
  {src:'()', ast:[]},
  {src:'(())', ast:[[]]},
  {src:'((()))', ast:[[[]]]},
  {src:'(()())', ast:[[],[]]},
  {src:'(hello 1 2)', ast:['hello', '1', '2']},
  {src:'(hello (nest 1 2))', ast:['hello', ['nest', '1', '2']]},
  {src:'(hello $nest "string \\" escape")', ast:['hello', '$nest', '"string \\" escape"']},
]

var tape = require('tape')

tape('simple', function (t) {
  console.log(toArrays(0))
  console.log(toArrays(l.cons(0)))
  t.deepEqual(toArrays(0), [])
  t.deepEqual(toArrays(l.cons(0,0)), [[]])
  t.deepEqual(toArrays(l.cons(0,l.cons(0, 0))), [[], []])
  t.deepEqual(toArrays(l.cons(l.cons(0, 0),l.cons(0, 0))), [[[]], []])

  t.deepEqual(codec.stringify(0), '()')
  t.deepEqual(codec.stringify(l.cons(0,0)), '(())')
  t.deepEqual(codec.stringify(l.cons(0,l.cons(0, 0))), '(() ())')
  t.deepEqual(codec.stringify(l.cons(l.cons(0, 0),l.cons(0, 0))), '((()) ())' )
  t.end()
})

tape('cons', function (t) {
  t.deepEqual(toCons(0), null)
  t.deepEqual(toCons(l.write('a')), 'a')
  t.deepEqual(toCons(l.cons(0,0)), {head: null, tail: null})

  t.deepEqual(toCons(l.cons(l.write('a'), 0)), {head: 'a', tail: null})

  t.deepEqual(
    toCons(l.cons(l.cons(0,0), 0)),
    {head: {head: null,tail:null}, tail: null}
  )
  t.deepEqual(
    toCons(l.cons(0, l.cons(0,0))), //(() ())
    {head: null, tail: {head: null,tail:null}}
  )
  t.end()
})

//function swap (a, b) {
//  if(!b) return a
//  return swap(l.cons(l.head(b), a), l.tail(b))
//}
//
//function reverse (list) {
//  return l.reverse(list)
//  if(!list) return list
//  return swap(l.cons(l.head(list), 0), l.tail(list))
//}
//
tape('reverse', function (t) {
  t.deepEqual(toCons(l.reverse(0)), null)

  t.deepEqual(
    toCons(l.reverse(
      l.cons(l.write('a'), 0)
    )),
    {head: 'a', tail: null}
  )

  t.deepEqual(
    toCons(l.reverse(l.cons(l.write('a'), l.cons(l.write('b'), 0)))),
    {head: 'b', tail: {head: 'a', tail: null}}
  )

  t.deepEqual(
    toCons(l.reverse(
      l.cons(l.write('a'), l.cons(l.write('b'), l.cons(l.write('c'), 0)))
    )),
    {head: 'c', tail: {head: 'b', tail: {head: 'a', tail: null}}}
  )

  t.end()
})

return
tape('reverse', function (t) {
  var h = l.cons(0, 0)
  h = l.cons(0, h)
  h = l.cons(0, h)
  h = l.cons(h, 0)
  h = l.cons(0, h)
  //then invert the tree
  h = reverse(h)
  h = l.set_head(l.head(h), l.tail(h))
  h = reverse(h)
//  h = l.set_head(l.head(h), l.tail(h))

})

src2ast.slice(0, 4).forEach(function (e) {
//var e = src2ast[0]
  tape('PARSE:'+e.src, function (t) {
    t.deepEqual(toArrays(codec.parse(e.src)), e.ast, 'parse to expected ast')
    t.equal(codec.stringify(codec.parse(e.src)), e.src, 'stringify back to src')
    t.end()
  })
})












