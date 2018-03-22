
var l = require('./')

function append(list, value) {
  value = 'string' === typeof value ? l.write(value) : value
  if(!l.head(list)) {
    return l.set_head(list, value)
  }
  return l.append(list, value)
}

exports.parse = function (s) { return l.parse(l.write(s)) }
/*
//previous javascript wat parser.
//it's a lot less verbose than raw wat.
function parse (s) {
  var last = l.cons(0,0)
  while(s.length) {
    if(s[0] == '(') {
      last = l.cons(last, 0)
      s = s.substring(1)
    }
    else if(s[0] == ')') {
      last = l.reverse(last)
      last = l.cons(l.tail(last), l.head(last))
      s = s.substring(1)
    }
    else if(/\s/.test(s[0]))
      s = s.substring(1)
    else if(/^;;/.test(s))
      s = s.substring(s.indexOf('\n'))
    else if('"' === s[0]) {
      var m = /"(?:(?:\\")|[^"])+"/.exec(s)
      last = l.cons(l.write(m[0]), last)
      s = s.substring(m[0].length)
    } else {
      var m = /[^\s|(|)]+/.exec(s)
      last = l.cons(l.write(m[0]), last)
      s = s.substring(m[0].length)
    }
  }
  return l.head(last)
}*/

function each (list, iter) {
  if(!list) return
  iter(l.head(list))
  each(l.tail(list), iter)
}

exports.stringify = function stringify (ast) {
  return (
    l.is_cons(ast) ? (function () {
      var s = '('
      each(ast, function (e) {
        s += (s == '(' ? '' : ' ') + stringify(e)
      })
      s +=')'
      return s
    })()
  : l.read(ast)
  )
}

if(!module.parent) {
  console.log(exports.stringify(exports.parse(require('fs').readFileSync(process.argv[2], 'utf8'))))
}

