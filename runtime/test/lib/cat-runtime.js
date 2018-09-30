var rt = require('../../humbaba-runtime');

var copyChar = new rt.IoBind(
  rt.GetChar,
  new rt.Box(function (char) {
    rt.PutChar.call(this, char);
  })
);

var program = {};
rt.IoBind.call(program,
  rt.IsEOF,
  new rt.Box(function (eof) {
    switch (eof.tag) {
      case rt.TRUE:
        rt.IoPure.call(this, rt.Unit);
        break;
      case rt.FALSE:
        rt.IoBind.call(this,
          copyChar,
          new rt.Box(function (_unit) {
            rt.Indirect.call(this, program);
          })
        );
        break;
      default:
        throw new Error('bad tag in eof value');
    }
  })
);
exports.program = program;
