;; functions I didn't end up needing

(module

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

  ;;retrive an item in a list that points to param
  (func $find_eq (param $list i32) (param $value i32) (result i32)
    (if
      (i32.eq (call $head (get_local $list)) (get_local $value) )
      (then (return (get_local $list)))
      (else (return (call $find_eq
            (call $tail (get_local $list))
            (get_local $value)
      )))
    )
  )
)
