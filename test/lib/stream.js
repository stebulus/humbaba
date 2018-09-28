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

function outputChunks(stream, expected, message) {
  t.test(message, function (t) {
    getOutput(stream, function (actualOutput) {
      t.strictSame(actualOutput, expected, message);
      t.end();
    });
  });
}
exports.outputChunks = outputChunks;

function output(stream, expected, message) {
  t.test(message, function (t) {
    getOutputString(stream, function (actualOutput) {
      t.strictSame(actualOutput, expected, message);
      t.end();
    });
  });
}
exports.output = output;

function outputJSON(stream, expected, message) {
  t.test(message, function (t) {
    getOutputString(stream, function (actualOutput) {
      t.strictSame(JSON.parse(actualOutput), expected, message);
      t.end();
    });
  });
}
exports.outputJSON = outputJSON;
