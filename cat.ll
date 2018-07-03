{ main = ioBind isEOF loop
; loop eof = cased eof of
  { True > ioPure Unit
  ; False > ioThen (ioBind getChar putChar) main
  }
; ioThen ioa iob = ioBind ioa (const iob)
; const x y = x
}
