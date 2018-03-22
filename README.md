# l5

low level lisp like language (L5)

subset of web assembly s-expression text format,
goal: be self-hosting.

## what does this do?

currently can parse it's own source code and build a ast
in memory, without relying on javascript for parsing!

``` js
> node codec.js ./l5.wat
(module (global $free (mut i32) (i32.const 16)) (global $root (mut i32) (i32.const 0)) (memory $memory 10) (func $claim (param $length i32) (result i32) (local $_free i32) (set_local $_free (get_global $free)) (set_global $free (i32.add (get_global $free) (get_local $length))) (get_local $_free)) (func $cons (export "cons") (param $head i32) (param $tail i32) (result i32) (i32.store (get_global $free) (i32.const 3)) (i32.store (i32.add (get_global $free) (i32.const 4)) (get_local $head)) (i32.store (i32.add (get_global $free) (i32.const 8)) (get_local $tail)) (call $claim (i32.const 12))) (func $is_string (export "is_string") (param $str i32) (result i32) (i32.eq (i32.and (i32.load (get_local $str)) (i32.const 7)) (i32.const 4))) (func $is_cons (export "is_cons") (param $cons i32) (result i32) (i32.lt_u (i32.and (i32.load (get_local $cons)) (i32.const 7)) (i32.const 4))) (func $head (export "head") (param $list i32) (result i32) (i32.load (i32.add (get_local $list) (i32.const 4)))) (func $tail (export "tail") (param $list i32) (result i32) (i32.load (i32.add (get_local $list) (i32.const 8)))) (func $set_head (export "set_head") (param $list i32) (param $value i32) (result i32) (i32.store (i32.add (get_local $list) (i32.const 4)) (get_local $value)) (get_local $list)) (func $set_tail (export "set_tail") (param $list i32) (param $value i32) (result i32) (i32.store (i32.add (get_local $list) (i32.const 8)) (get_local $value)) (get_local $value)) (func $string (export "string") (param $length i32) (result i32) (i32.store (get_global $free) (i32.or (i32.const 4) (i32.shl (get_local $length) (i32.const 8)))) (call $claim (i32.add (get_local $length) (i32.const 4)))) (func $string_length (export "string_length") (param $str i32) (result i32) (i32.shr_u (i32.load (get_local $str)) (i32.const 8))) (func $last (export "last") (param $list i32) (result i32) (if (call $tail (get_local $list)) (return (call $last (call $tail (get_local $list))))) (return (get_local $list))) (func $append (export "append") (param $list i32) (param $value i32) (result i32) (call $set_tail (call $last (get_local $list)) (call $cons (get_local $value) (i32.const 0)))) (export "memory" (memory $memory)))
```

I am learning a lot about using pointers.
If it was a javascript implementation, I'd just use [] and
[].push() to create the data structure,
but we have to do everything via pointers and lists
(that's why it's called LisP!)

so, the trick was building the nested structure in reverse.
the last item you parsed points back to the previous.

`(a b c)` becomes `c->b->a->0`
and when you hit the `)` you reverse the list.
but it's more interesting when you consider nested lists
`(a b c (d e))` becomes `(e->d->(c->b->a->0))`
remember that lisp cells have to pointers. to make a straight
list, the `head` points to a value, and the `tail` points to the rest
of the list. when `head` points to a list, that is a nested list.

The so `d` points to a cell that has the first level list (in reverse)
as it's head. when we hit the first `)` (at the second level)
we reverse the 2nd level list, and are left holding the first cell,
which points to the first level list (the rest of the tree).
this section is now fully parsed, so we attach a cell that points
to the tail of the reversed 2nd level list, then we hit the end
of that, we reverse the first list and now we have the ast.

The neat thing about this is it's fully functional and super terse
too! I just spent way more characters describing it in engilsh
that it took to implemented even considering `wat`'s verboseness
(buried deep in the parsing code)

Pretty sure this is how god parses lisp.

## data structures

lisp is lists. a list is conses, or strings.
a cons is 3 i32 words (12 bytes)
the first word is a tag.
if the lowest nyble (4 bits) in the tag is <= 3 it's a cons.
3 means the cons is two pointers (to other values)

(not implemented yet:
  0 means a pair of i32 values instead of pointers
  1 means a i32 value and then a pointer
  2 means a pointer then a i32 value.
)

a pointer can point at a cons or a string.
a string has a tag like a pointer, but the lowest byte is 4.

in strings, the top 3 bytes in the tag is the length of the string.
the body of the string follows, length bytes long, starting
4 bytes after the pointer.

(the higher bits in the nibble are not yet used, but they
will probably be used for garbage collection)

## api

### cons (a, b)

create a cons with `a` and `b` as cells. (both are i32 pointers)

### is_cons (c)

returns 1 if `c` is a cons

### is_string (s)

return 1 if `s` is a string

### string_length (s)

returns the length of the string.

### head (c)

return the value at the head of the cons `c`.

### tail (c)

return the value at the tail of the cons `c`

### set_head (c, v)

sets the value at the head of the cons `c` to `v`,
`c` is returned.

### set_tail (c, v)

sets the value at the tail of the cons `c` to `v`
`v` is returned.

### write (string) => s

pass a string from javascript land into wasm land. returns pointer
to s

### read (s)

extracts a string from wasm land to javascript land, takes a pointer
returned by `write` (or extracted from a cons)
throws if s is not a string.


## License

MIT




