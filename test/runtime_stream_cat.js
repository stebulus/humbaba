var rt = require('../humbaba-runtime');
var rts = require('../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var tp = require('../test-lib/promise');
var ts = require('../test-lib/stream');

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

function testWriting(chunks, message) {
  var copy = new rts.Stream(program);
  for (var i = 0; i < chunks.length; i++)
    copy.write(chunks[i]);
  copy.end();
  tp.resolvesStrictSame(t, ts.output(copy), chunks.join('').split(''),
    message + ' (writing)');
}

function testPiping(chunks, message) {
  var copy = new rts.Stream(program, new ChunkReadable(chunks));
  tp.resolvesStrictSame(t, ts.output(copy), chunks.join('').split(''),
    message + ' (piping)');
}

var chunkses = [
  [],
  ['abc'],
  ['abc', 'xyz'],
];

for (var i = 0; i < chunkses.length; i++) {
  var message = 'copy ' + JSON.stringify(chunkses[i]);
  testWriting(chunkses[i], message);
  testPiping(chunkses[i], message);
}
