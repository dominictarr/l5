
function find_func (name, env) {

}

function l5_eval (code, env) {
//  return l5_eval (find_func(l.head(code))
}

var tape = require('tape')

var l = require('../')
var codec = require('../codec')

function ev(t, src, expected) {
  var ast = l.parse(l.write(src))
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

  var expr = l.parse(l.write('(+ 1 2)'))
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


//tape('?', function (t) {
//  ev(t, '((? 0 10 20))', 20)
//  ev(t, '((? 1 10 20))', 10)
//
//  t.end()
//})


