var stream = require('stream');
var t = require('tap');

function collect(arr) {
  return new stream.Writable({
    write(chunk, _encoding, callback) {
      arr.push(chunk.toString());
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

function output(stream, form, expected, message) {
  t.test(message, function (t) {
    getOutput(stream, function (actual) {
      t.strictSame(form(actual), expected, message);
      t.end();
    });
  });
}
exports.output = output;

function asChunks(chunks) { return chunks; }
exports.asChunks = asChunks;

function asString(chunks) { return chunks.join(''); }
exports.asString = asString;

function asJSON(chunks) { return JSON.parse(asString(chunks)); }
exports.asJSON = asJSON;
