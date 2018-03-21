# l5

low level lisp like language (L5)

subset of web assembly s-expression text format,
goal: be self-hosting.

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



