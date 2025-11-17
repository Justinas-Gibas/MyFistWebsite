(module
  (memory (export "mem") 1)
  (func $multmat4 (export "multmat4") (param $out i32) (param $a i32) (param $b i32)
    (local $i i32)
    (local $j i32)
    (local $k i32)
    (local $sum f32)

    (local.set $i (i32.const 0))
    (loop $row_loop
      (local.set $j (i32.const 0))
      (loop $col_loop
        (local.set $sum (f32.const 0))
        (local.set $k (i32.const 0))
        (loop $sum_loop
          (local.set $sum
            (f32.add
              (local.get $sum)
              (f32.mul
                (f32.load (i32.add (local.get $a) (i32.mul (i32.add (local.get $i) (i32.mul (local.get $k) (i32.const 4))) (i32.const 4))))
                (f32.load (i32.add (local.get $b) (i32.mul (i32.add (local.get $k) (i32.mul (local.get $j) (i32.const 4))) (i32.const 4))))
              )
            )
          )
          (local.set $k (i32.add (local.get $k) (i32.const 1)))
          (br_if $sum_loop (i32.lt_s (local.get $k) (i32.const 4)))
        )
        (f32.store (i32.add (local.get $out) (i32.mul (i32.add (local.get $i) (i32.mul (local.get $j) (i32.const 4))) (i32.const 4))) (local.get $sum))
        (local.set $j (i32.add (local.get $j) (i32.const 1)))
        (br_if $col_loop (i32.lt_s (local.get $j) (i32.const 4)))
      )
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $row_loop (i32.lt_s (local.get $i) (i32.const 4)))
    )
  )
)