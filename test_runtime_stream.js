var stream = require('stream');

var test = require('./test');
var rt = require('./runtime');
var rts = require('./runtime_stream');

function collect(arr) {
  return new stream.Writable({
    write(chunk, _encoding, callback) {
      arr.push(chunk);
      callback();
    }
  });
}

function expectOutput(expected, stream, callback) {
  var actualOutput = []
  stream.pipe(collect(actualOutput))
    .on('finish', function () {
      test.runTest(function () {
        for (var i = 0; i < actualOutput.length; i++)
          actualOutput[i] = actualOutput[i].toString();
        test.assertSame(expected, actualOutput);
      }, callback);
    });
}

tests = {

  nullProgram(callback) {
    var program = new rt.IoPure(rt.Unit);
    expectOutput([], new rts.Stream(program), callback);
  },

  emitOneChar(callback) {
    var program = new rt.PutChar(new rt.Box('x'));
    expectOutput(['x'], new rts.Stream(program), callback);
  },

  emitSeveralChars(callback) {
    var program = new rt.IoBind(
      new rt.PutChar(new rt.Box('x')),
      new rt.Box(function (_unit) {
        rt.IoBind.call(this,
          new rt.PutChar(new rt.Box('y')),
          new rt.Box(function (_unit) {
            rt.PutChar.call(this, new rt.Box('z'));
          })
        );
      })
    );
    expectOutput(['x', 'y', 'z'], new rts.Stream(program), callback);
  },

  copyOneChar(callback) {
    var program = new rt.IoBind(
      rt.GetChar,
      new rt.Box(function (char) {
        rt.PutChar.call(this, char);
      })
    );
    var stream = new rts.Stream(program);
    stream.end('x');
    expectOutput(['x'], stream, callback);
  },

  copyAllChars(callback) {
    var copyChar = new rt.IoBind(
      rt.GetChar,
      new rt.Box(function (char) {
        rt.PutChar.call(this, char);
      })
    );
    var program = {};
    rt.IoBind.call(program,
      rt.IsEof,
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
    var stream = new rts.Stream(program);
    stream.write('abc');
    stream.write('xyz');
    stream.end();
    expectOutput(['a', 'b', 'c', 'x', 'y', 'z'], stream, callback);
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);