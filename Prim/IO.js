var rt = require('humbaba-runtime');
exports.$ioPure = new rt.Box(rt.IoPure);
exports.$ioBind = new rt.Box(rt.IoBind);
exports.$getChar = rt.GetChar;
exports.$putChar = new rt.Box(rt.PutChar);
exports.$isEOF = rt.IsEOF;
