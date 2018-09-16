var stream = require('stream');

var test = require('./lib/test');
var test_rts = require('./runtime_stream');
var rt = require('../humbaba-runtime');
var rts = require('../humbaba-runtime-stream');

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

function ChunkReadable(chunks) {
  var i = 0;
  return new stream.Readable({
    read() {
      if (i < chunks.length)
        this.push(chunks[i++]);
      else
        this.push(null);
    }
  });
}

function testWriting(chunks) {
  return function (callback) {
    var copy = new rts.Stream(program);
    for (var i = 0; i < chunks.length; i++)
      copy.write(chunks[i]);
    copy.end();
    test_rts.expectOutput(chunks.join('').split(''), copy, callback);
  };
}

function testPiping(chunks) {
  return function (callback) {
    var copy = new rts.Stream(program, new ChunkReadable(chunks));
    test_rts.expectOutput(chunks.join('').split(''), copy, callback);
  };
}

var chunkses = [
  [],
  ['abc'],
  ['abc', 'xyz'],
];

tests = {}
for (var i = 0; i < chunkses.length; i++) {
  var prefix = 'copyChunk_' + i.toString() + '_';
  tests[prefix + 'writing'] = testWriting(chunkses[i]);
  tests[prefix + 'piping'] = testPiping(chunkses[i]);
}
exports.tests = tests;

if (require.main === module)
  test.main(tests);
