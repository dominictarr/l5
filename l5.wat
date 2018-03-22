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

  ;; second throught: that is too clever.
  ;; just point to a boxed number.

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

  ;; === core --------------------------------------
  ;;
  ;; creating cells, checking types, manipulating lists

  ;; cons with 2 pointers
  (func $cell (export "cell") (param $head i32) (param $tail i32) (result i32)

    (i32.store
      (get_global $free)
      (i32.const 0x3000000) ;; 3 == cons with 2 pointers
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

  (func $cons (export "cons")
    (param $head i32) (param $tail i32)
    (result i32)
    (call $cell (get_local $head) (get_local $tail))
  )

  (func $is_string (export "is_string") (param $str i32) (result i32)
    (i32.eq
      (i32.and (i32.load (get_local $str)) (i32.const 0x7000000))
      (i32.const 0x4000000)
    )
  )

  (func $is_cons (export "is_cons") (param $cons i32) (result i32)
    ;; can be 0, 1, 2, 3. 1 if that cell is a pointer (0 if i32 value)
    (i32.lt_u
      (i32.and (i32.load (get_local $cons)) (i32.const 0x7000000))
      (i32.const 0x4000000)
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

  (func $swap (param $a i32) (param $b i32) (result i32)
    (if (i32.eqz (get_local $b)) (return (get_local $a)))
    (call $swap
      (call $cell (call $head (get_local $b)) (get_local $a))
      (call $tail (get_local $b))
    )
  )

  (func $reverse (export "reverse") (param $list i32) (result i32)
    (if (i32.eqz (get_local $list)) (return (i32.const 0)))
    (call $swap
      (call $cell (call $head (get_local $list)) (i32.const 0))
      (call $tail (get_local $list))
    )
  )

  ;; --- STRINGS -------------------------------------------------

  (func $string (export "string") (param $length i32) (result i32)
    (i32.store
      (get_global $free)
      (i32.or
        (i32.const 0x4000000) ;; 4 == cons with 2 pointers
        (i32.and (get_local $length) (i32.const 0xffffff))
      )
    )

    ;; TODO: round up to next 4 bytes alignment, plus the tag

    (call $claim (i32.add (get_local $length) (i32.const 4)))
  )

  (func $string_length (export "string_length") (param $str i32) (result i32)
    ;; type information, check if this position is really a string
    ;;(i32.shr_u
    (i32.and (i32.load (get_local $str)) (i32.const 0xffffff))
    ;;(i32.const 8))
  )

  (func $copy_to_string
    (param $start i32) (param $end i32)
    (result i32)
    (local $str i32)
    (local $ptr i32)
    (set_local $str (call $string
        (i32.sub (get_local $end) (get_local $start))
    ))
    (set_local $ptr (i32.add (get_local $str) (i32.const 4)))
    (loop $next
      (if (i32.eq (get_local $start) (get_local $end))
        (return (get_local $str))
      )
      (i32.store8
        (get_local $ptr)
        (i32.load8_u (get_local $start))
      )
      (set_local $ptr (i32.add (get_local $ptr) (i32.const 1)))
      (set_local $start (i32.add (get_local $start) (i32.const 1)))
      (br $next)
    )
    (unreachable)
  )

  ;;compare two strings
  (func $string_equal (export "string_equal")
    (param $a i32) (param $b i32) (result i32)
    (local $end i32)

    (if
      (i32.ne
        (tee_local $end (call $string_length (get_local $a)))
        (call $string_length (get_local $b))
      )
      (return (i32.const 0))
    )
    ;; naughty, use $a and $b as pointers!
    ;; and save a few ops to get $end correct
    (set_local $end (i32.add
      (get_local $end)
      (tee_local $a (i32.add (get_local $a) (i32.const 4)) )
    ))
    (set_local $b (i32.add (get_local $b) (i32.const 4)) )
    (loop $more
      (if
        (i32.eq (get_local $a) (get_local $end))
        (return (i32.const 1))
      )
      (if
        (i32.ne
          (i32.load8_u (get_local $a))
          (i32.load8_u (get_local $b))
        )
        (return (i32.const 0))
      )
      (set_local $a (i32.add (get_local $a) (i32.const 1) ))
      (set_local $b (i32.add (get_local $b) (i32.const 1) ))
      (br $more)
    )
    (unreachable)
  )

  ;; /=============================================\
  ;; | PARSER                                      |
  ;; |                                             |
  ;; | here comes the uglyist part.                |
  ;; | once I have macros this can be moved out... |
  ;; \=============================================/

  ;; greater than 42, or $=36, consider as names
  (func $is_name_char (param $char i32) (result i32)
    (i32.and
      (i32.ne (get_local $char) (i32.const 59)) ;; ";" (comment)
      (i32.or
        (i32.ge_u (get_local $char) (i32.const 42)) ;; "*"...
        (i32.eq (get_local $char) (i32.const 36)) ;; "$"
      )
    )
  )

  (func $is_whitespace (param $char i32) (result i32)
    (i32.le_u (get_local $char) (i32.const 32))
  )

  (func $parse (export "parse") (param $src i32) (result i32)
    (local $max i32)
    (local $ptr i32)
    (local $str i32)
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

    (loop $more
      (if (i32.gt_u (get_local $ptr) (get_local $max))
        ;; if we are not back to the root cell, it's a syntax error
        (return (call $head (get_local $last)))
      )
      ;; read the next character
      (set_local $char (i32.load8_u (get_local $ptr)))
      (if (i32.eqz (get_local $state))
        (if (i32.eq (get_local $char) (i32.const 40) )
          ;;HANDLE "(" open bracket
          (set_local $last (call $cell
            (get_local $last) (i32.const 0)
          ))
          (if (i32.eq (get_local $char) (i32.const 41) )
            (then
              ;;HANDLE ")" open bracket
              (set_local $last (call $reverse (get_local $last)))
              (set_local $last (call $cell
                  (call $tail (get_local $last))
                  (call $head (get_local $last))
              ))
            )
            (if (call $is_name_char (get_local $char))
              (then
                ;; switch to name state
                (set_local $state (i32.const 1))
                (set_local $str (get_local $ptr))
              )
              (if
                (i32.eq (get_local $char) (i32.const 34))
                (then
                  ;;fallthrough to quoted string state
                  (set_local $str (get_local $ptr))
                  (set_local $state (i32.const 3))
                )
                (if
                    (i32.eqz (call $is_whitespace (get_local $char)))
                    (then
                      ;; must be a comment
                      (set_local $state (i32.const 2))
                      (br $more)
                    )
                )
              )
            )
          )
        )
      )
      (if (i32.eq (get_local $state) (i32.const 1))
        ;; if not name char anymore, create the string


        (if (i32.eqz (call $is_name_char (get_local $char))) (then
          (set_local $last
            (call $cons
              (call $copy_to_string (get_local $str) (get_local $ptr))
              (get_local $last)
            )
          )

          ;; write into the string

          (set_local $state (i32.const 0))

          ;; go back to the top of the loop,
          ;; because we need to handle this char not increment
          (br $more)
        ))
      )
      ;; handle comments
      (if (i32.eq (get_local $state) (i32.const 2))
        ;; if not name char anymore, create the string

        (if (i32.eq (get_local $char) (i32.const 10))
          (then

            ;; write into the string

            (set_local $state (i32.const 0))
            (br $more)
        ))
      )
      ;; handle quoted strings
      (if (i32.eq (get_local $state) (i32.const 3))
        ;; if not name char anymore, create the string
        (if (i32.eq (get_local $char) (i32.const 92))
          (set_local $state (i32.const 4))
            (if (i32.and
                (i32.ne (get_local $str) (get_local $ptr))
                (i32.eq (get_local $char) (i32.const 34))
              )
              (then
                ;; write into the string
                (set_local $last
                  (call $cons
                    (call $copy_to_string
                      (get_local $str)
                      ;; ptr + 1 because we havn't stepped past yet
                      (i32.add (get_local $ptr) (i32.const 1))
                    )
                    (get_local $last)
                  )
                )

                ;; go back into () state
                (set_local $state (i32.const 0))
              )
            )
          )
        ;; escapes in quoted strings!
        (if (i32.eq (get_local $state) (i32.const 4))
          ;; go back to string state, after this loop
          (set_local $state (i32.const 3))
        )
      )

      (set_local $ptr (i32.add (get_local $ptr) (i32.const 1)))
      (br $more)
    )
    (unreachable)
  )

  (export "memory" (memory $memory))
)

