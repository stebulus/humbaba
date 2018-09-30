var rt = require('humbaba-runtime');
exports.$pure = new rt.Box(rt.IoPure);
exports.$bind = new rt.Box(rt.IoBind);
exports.$getChar = rt.GetChar;
exports.$putChar = new rt.Box(rt.PutChar);
exports.$isEOF = rt.IsEOF;
