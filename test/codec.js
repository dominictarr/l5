

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

/*
  I was struggling to write the parser, and I had the idea
  to built the tree backwards then invert it. this has
  the neat implication that it's totally functional.
  and we only need a single pointer to track the entire structure.

  start off with a cons a=(())
  when we append an item to this, `a = cons(item, a)`
  now we want to create a new sub list, it's `a = cons(a, 0)`
  to get back out of the sublist,
  we do: `cons(tail(a = reverse(a)), head(a))`
  while parsing, an empty list is represented as a (0,0) pair
  but when we are done, 0 is the empty list (0,0) is (())
*/

function invert (list) {
  list = l.reverse(list)
  //the head of the list points to the parent list
  //so create a new cell which contains the list and points
  //back to the current list
  return l.cons(l.tail(list), l.head(list))
}

tape('invert', function (t) {
  var h = l.cons(l.write('a'), 0)
  h = l.cons(l.write('b'), h)
  h = l.cons(l.write('c'), h)
  t.deepEqual(toCons(h), {head: 'c', tail: {head: 'b', tail: {head: 'a', tail: null}}})
  t.deepEqual(toArrays(h), ['c','b','a'])
//  h = l.cons(h, 0)
//  h = l.cons(0, h)
//  //then invert the tree
//  h = reverse(h)
//  h = l.set_head(l.head(h), l.tail(h))
//  h = reverse(h)
////  h = l.set_head(l.head(h), l.tail(h))
  t.end()
})

src2ast.slice(0, 4).forEach(function (e) {
//var e = src2ast[0]
  tape('PARSE:'+e.src, function (t) {
    t.deepEqual(toArrays(codec.parse(e.src)), e.ast, 'parse to expected ast')
    t.equal(codec.stringify(codec.parse(e.src)), e.src, 'stringify back to src')
    t.end()
  })
})

















