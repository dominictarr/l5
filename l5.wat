(module
  ;; a cons is three i32 tag, head, tail
  ;; since max size is also 8 bytes, a 4 byte number can fit there.
  ;; at 0 is a root cons that always points to the last
  ;; created cons


  ;; room for pointers to
  ;; 1) the next empty space
  ;; -- 2) next unused cons
  ;; -- 3) ast root
  ;; -- 4) function definitions

  (import "console" "log" (func $log (param i32)))

  (global $free (mut i32) (i32.const 16))
  (global $root (mut i32) (i32.const 0))

  (memory $memory 10)

  ;; increase the pointer to free space
  (func $claim (param $length i32) (result i32)
    (local $_free i32)
    (set_local $_free (get_global $free))
    (set_global $free (i32.add (get_global $free) (get_local $length)))
    (get_local $_free)
  )

  ;; cons with 2 pointers
  (func $cons (export "cons") (param $head i32) (param $tail i32) (result i32)

    (i32.store
      (get_global $free)
      (i32.const 3) ;; 3 == cons with 2 pointers
    )

    (i32.store
      (i32.add (get_global $free) (i32.const 4))
      (get_local $head)
    )

    (i32.store
      (i32.add (get_global $free) (i32.const 8))
      (get_local $tail)
    )

    (call $claim (i32.const 12))
  )

  (func $swap (param $a i32) (param $b i32) (result i32)
    (if (i32.eqz (get_local $b)) (return (get_local $a)))
    (call $swap
      (call $cons (call $head (get_local $b)) (get_local $a))
      (call $tail (get_local $b))
    )
  )

  (func $reverse (export "reverse") (param $list i32) (result i32)
    (if (i32.eqz (get_local $list)) (return (i32.const 0)))
    (call $swap
      (call $cons (call $head (get_local $list)) (i32.const 0))
      (call $tail (get_local $list))
    )
  )

  (func $is_string (export "is_string") (param $str i32) (result i32)
    (i32.eq
      (i32.and (i32.load (get_local $str)) (i32.const 7))
      (i32.const 4)
    )
  )

  (func $is_cons (export "is_cons") (param $cons i32) (result i32)
    ;; can be 0, 1, 2, 3. 1 if that cell is a pointer (0 if i32 value)
    (i32.lt_u
      (i32.and (i32.load (get_local $cons)) (i32.const 7))
      (i32.const 4)
    )
  )

  (func $head (export "head") (param $list i32) (result i32)
    (i32.load (i32.add (get_local $list) (i32.const 4)))
  )

  (func $tail (export "tail") (param $list i32) (result i32)
    (i32.load (i32.add (get_local $list) (i32.const 8)))
  )

  (func $set_head (export "set_head") (param $list i32) (param $value i32) (result i32)
    (i32.store (i32.add (get_local $list) (i32.const 4)) (get_local $value))
    (get_local $list)
  )

  (func $set_tail (export "set_tail") (param $list i32) (param $value i32)(result i32)
    (i32.store (i32.add (get_local $list) (i32.const 8)) (get_local $value))
    (get_local $value)
  )

  (func $string (export "string") (param $length i32) (result i32)
    (i32.store
      (get_global $free)
      (i32.or
        (i32.const 4) ;; 4 == cons with 2 pointers
        ;; and store length in top 2 bits
        (i32.shl (get_local $length) (i32.const 8))
      )
    )

    ;; TODO: round up to next 4 bytes alignment, plus the tag

    (call $claim (i32.add (get_local $length) (i32.const 4)))
  )

  (func $string_length (export "string_length") (param $str i32) (result i32)
    ;; type information, check if this position is really a string
    (i32.shr_u (i32.load (get_local $str)) (i32.const 8))
  )

  (func $string_write (export "string_write")
    (param $str i32) (param $i i32) (param $char i32)
    ;;only write inside the string
    (if (i32.gt_u (get_local $i)
        (call $string_length (get_local $str))
      )
      (return)
    )
    (i32.store8
      (i32.add (i32.add (get_local $i) (get_local $str)) (i32.const 4))
      (get_local $char)
    )
  )

  (func $last (export "last") (param $list i32) (result i32)
    (if
      (call $tail (get_local $list))
      (return (call $last (call $tail (get_local $list))))
    )
    (return (get_local $list))
  )

  (func $append (export "append")
    (param $list i32) (param $value i32)
    (result i32)

    (call $set_tail
      (call $last (get_local $list) )
      (call $cons (get_local $value) (i32.const 0) )
    )
  )

  (func $index_of (export "index_of")
    (param $string i32) (param $value i32)
    (result i32)

    (local $length i32)
    (local $i i32)
    (set_local $length
      (i32.add
        (call $string_length (get_local $string))
        (i32.const 4)
    ))
    (set_local $i (i32.const 4) )

    (loop $again
      (if (i32.eq (get_local $i) (get_local $length) )
        (return (i32.const -1) )
      )
      (if
        (i32.eq
          (i32.load8_u
            (i32.add (get_local $i) (get_local $string))
          )
          (get_local $value)
        )
        (return (i32.sub (get_local $i) (i32.const 4) ))
      )
      (set_local $i (i32.add (get_local $i) (i32.const 1) ))
      (br $again)
    )
    (i32.const -1)
  )

  (func $empty (result i32)
    (call $cons (i32.const 0) (i32.const 0))
  )


  (func $parse (export "parse") (param $src i32) (result i32)
    (local $max i32)
    (local $ptr i32)
    (local $char i32)
    (local $state i32)
    (local $last i32)
    ;; start of the src string
    (set_local $ptr (i32.add (get_local $src) (i32.const 4)))
    ;; end of the string (1 past the last char)
    (set_local $max
      (i32.add
        (i32.add (get_local $src) (call $string_length (get_local $src)))
        (i32.const 4)
    ))
    (set_local $state (i32.const 0))

    ;; this will be the root of the ast
    (set_local $last (call $empty))

    (loop $more
      (if (i32.gt_u (get_local $ptr) (get_local $max))
        ;; if we are not back to the root cell, it's a syntax error
        (return (call $head (get_local $last)))
        ;;(return (get_local $last))
      )
      ;; read the next character
      (set_local $char (i32.load8_u (get_local $ptr)))

      (call $log (get_local $char))

      (if (i32.eq (get_local $char) (i32.const 40) )
        (then
          ;;HANDLE "(" open bracket
          (set_local $last (call $cons
            (get_local $last)
            (i32.const 0)
          ))
        )
        (else (if (i32.eq (get_local $char) (i32.const 41) )
          (then
            ;;HANDLE ")" open bracket
            (set_local $last (call $reverse (get_local $last)))
            (set_local $last (call $cons
                (call $tail (get_local $last))
                (call $head (get_local $last))
            ))
          )
          ;; greater than 42, or $=36, consider as names
          (else (if (i32.or
              (i32.ge_u (get_local $char) (i32.const 42)) ;; "*"...
              (i32.eq (get_local $char) (i32.const 36)) ;; "$"
            )
            (then
              (set_local $last
                (call $cons (call $string (i32.const 1)) (get_local $last))
              )
              ;; write into the string
              (call $string_write
                (call $head (get_local $last))
                (i32.const 0)
                (get_local $char)
              )
            )
          ))
        ))
      ) ;;if

      (set_local $ptr (i32.add (get_local $ptr) (i32.const 1)))
      (br $more)
    )
    (unreachable)
  )


  ;; substring?

  (export "memory" (memory $memory))
)

