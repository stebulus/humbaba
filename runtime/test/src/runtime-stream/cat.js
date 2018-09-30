var cat = require('../../lib/cat-runtime');
var rt = require('../../../humbaba-runtime');
var rts = require('../../../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var tp = require('../../lib/promise');
var ts = require('../../lib/stream');

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
  var copy = new rts.Stream(cat.program);
  for (var i = 0; i < chunks.length; i++)
    copy.write(chunks[i]);
  copy.end();
  tp.resolvesStrictSame(t, ts.output(copy), chunks.join('').split(''),
    message + ' (writing)');
}

function testPiping(chunks, message) {
  var copy = new rts.Stream(cat.program, new ChunkReadable(chunks));
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
