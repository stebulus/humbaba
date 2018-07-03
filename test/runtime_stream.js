var stream = require('stream');

var test = require('./lib/test');
var rt = require('../runtime');
var rts = require('../runtime_stream');

function collect(arr) {
  return new stream.Writable({
    write(chunk, _encoding, callback) {
      arr.push(chunk);
      callback();
    }
  });
}

function getOutput(stream, callback) {
  var actualOutput = []
  stream.pipe(collect(actualOutput))
    .on('finish', function () {
      callback(actualOutput);
    });
}
exports.getOutput = getOutput;

function getOutputString(stream, callback) {
  getOutput(stream, function (chunks) { callback(chunks.join('')); });
}
exports.getOutputString = getOutputString;

function expectOutput(expected, stream, callback) {
  getOutput(stream, function (actualOutput) {
    test.runTest(function () {
      for (var i = 0; i < actualOutput.length; i++)
        actualOutput[i] = actualOutput[i].toString();
      test.assertSame(expected, actualOutput);
    }, callback);
  });
}
exports.expectOutput = expectOutput;

function expectOutputString(expected, stream, callback) {
  getOutputString(stream, function (actualOutput) {
    test.runTest(function () {
      test.assertSame(expected, actualOutput);
    }, callback);
  });
}
exports.expectOutputString = expectOutputString;

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

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
