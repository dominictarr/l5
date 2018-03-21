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
    (if
      ;;equal to zero is the same as ! (not)
      (i32.eqz (call $is_cons (get_local $list)))
      (return (i32.const -1))
    )
    (i32.load (i32.add (get_local $list) (i32.const 4)))
  )

  (func $tail (export "tail") (param $list i32) (result i32)
    (if
      (i32.eqz (call $is_cons (get_local $list)))
      (return (i32.const -1))
    )
    (i32.load (i32.add (get_local $list) (i32.const 8)))
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
    (if
      (i32.eqz (call $is_string (get_local $str)))
      (return (i32.const 0))
    )

    (i32.shr_u (i32.load (get_local $str)) (i32.const 8))
  )

  (export "memory" (memory $memory))
)

