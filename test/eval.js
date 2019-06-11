
function find_func (name, env) {

}

var tape = require('tape')

var l = require('../')
var codec = require('../codec')

function p (s) {
  return l.parse(l.write(s))
}

function ev(t, src, expected) {
  var ast = p(src)
  t.equal(
    l.int_value(
      l.eval(
        l.head(ast),
        //env is just a list of string: value pairs
        l.head(l.tail(ast))
      )
    ),
    expected,
    src
  )
}


//to eval an expression,
//if it's a number or string, return that.
//if it's a list, lookup the first element in the env
//if it's a variable (string but not quoted) look it up.

tape('test simple evals', function (t) {

  var expr = p('(+ 1 2)')
  console.log('expr_ptr', expr)
  t.equal(l.int_value(l.eval(l.int(3), l.cons(0,0))), 3)
  t.equal(l.read(l.eval(l.write('hello'), l.cons(0,0))), 'hello')

  console.log('expr_ptr', expr)
  console.log('expr.head_ptr', l.head(expr))
  t.equal(l.string_first_char(l.head(expr)), 43)

  t.equal(l.int_value(l.call_core(
    l.string_first_char(l.head(expr)),
    l.tail(expr)
  )), 3)

  console.log(codec.stringify(l.map_eval(l.tail(expr))))

  t.equal(l.int_value(l.eval(expr, l.cons(0,0))), 3)

  t.end()
})

tape('test nested eval', function (t) {

  ev(t, '((+ 1 2 (+ 3 4 5)))', 1+2+3+4+5)
  t.end()
})

tape('variables!', function (t) {
  ev(t, '((+ $three $five) (($three 3) ($five 5)))', 8)
  t.end()
})

tape('undefined variable!', function (t) {
  t.throws (function () {
    ev(t, '((+ $three $undef) (($three 3) ($five 5)))', 8)
  })
  t.end()
})


tape('if ?', function (t) {
  ev(t, '((? 0 10 20))', 20)
  ev(t, '((? 1 10 20))', 10)

  t.end()
})

tape('lambda !', function (t) {
//  ev(t, '( ((!($foo) (+ $foo 1)) 2))', 3)
  ev(t, '( (+ 1 $foo) (($foo 2)) )', 3)
  //ev(t, '( (stitch ($foo) (2)) )', '3')
  t.end()
})

var ary = [
  '1',
  '2',
  '(q)',
  '(q 1 2 3)',
  '(q ())',
  '(q (1 2) 3)',
  '(q (q))',
  '(q (q 1 2) 3)'
]


tape('can eval quotes', function (t) {
  var a = '(q 1 2 3)'
  ary.forEach(function (a, i) {
    console.log('EVAL:', a)
    var ast = p(a)
    t.doesNotThrow(function () {
      l.eval(ast, 0) //just check that that it evals without throwing
    })
  })
  t.end()
})

tape('equal', function (t) {
  var r1 = p('1')
  var r2 = p('1')
  t.ok(l.equal(r1, r2))
  t.ok(l.equal(r1, r1))
  ary.forEach(function (a, i) {
    var ast = l.parse(l.write(a))
    t.doesNotThrow(function () {
      console.log('head?:', codec.stringify(l.head(ast)))
    })
    ary.forEach(function (b, j) {
      var _a = p(a), _b = p(b)
      var src = '(= '+a+' '+b+')'
      t.equal(l.equal(_a, _b), +(i == j), (i == j)+ '= '+a+' '+b)
      t.equal(l.equal(l.eval(_a), l.eval(_b)), +(i == j))
      var ast = p(src)
      t.equal(l.int_value(l.eval(ast)), +(i == j))
      ev(t, '('+src+')', +(i === j))
    })
  })
  t.end()
})

tape('zip', function (t) {
  var zipped = l.zip(p('(a b c)'), p('(1 2 3)'))
  var zipped2 = l.zip(p('(a b c)'), p('(1 2)'))
  t.equal(codec.stringify(zipped), '((a 1) (b 2) (c 3))')
  t.equal(codec.stringify(zipped2), '((a 1) (b 2) (c))')

  t.equal(l.int_value(l.find_key(p('a'), zipped)), 1)
  t.equal(l.int_value(l.find_key(p('b'), zipped)), 2)
  t.equal(l.int_value(l.find_key(p('c'), zipped)), 3)
  t.equal(l.find_key(p('d'), zipped), 0)
  t.equal(l.find_key(p('c'), zipped2), 0)

  t.end()
})
