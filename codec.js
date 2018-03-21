
var l = require('./')

function append(list, value) {
  value = 'string' === typeof value ? l.write(value) : value
  if(!l.head(list)) {
    return l.set_head(list, value)
  }
  return l.append(list, value)
}

exports.parse = function parse (s) {
  var stack = l.cons(0, 0)
  var tree = null
  var head = stack

  while(s.length) {
    if(s[0] == '(') {
      var _head = l.cons(0, 0)
      if(head) l.append(head, _head)
      head = _head
      if(!tree) tree = head
      stack = l.cons(head, stack)
      s = s.substring(1)
    }
    else if(s[0] == ')') {
      stack = l.tail(stack)
      head = l.head(stack)
      s = s.substring(1)
    }
    else if(/\s/.test(s[0]))
      s = s.substring(1)
    else if(/^;;/.test(s))
      s = s.substring(s.indexOf('\n'))
    else if('"' === s[0]) {
      var m = /"(?:(?:\\")|[^"])+"/.exec(s)
      head = append(head, m[0])
      s = s.substring(m[0].length)
    } else {
      var m = /[^\s|(|)]+/.exec(s)
      head = append(head, m[0])
      s = s.substring(m[0].length)
    }
  }
  return tree
}

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

