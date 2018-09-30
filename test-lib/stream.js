var stream = require('stream');

function collect(arr) {
  return new stream.Writable({
    write(chunk, _encoding, callback) {
      arr.push(chunk.toString());
      callback();
    }
  });
}

function output(stream) {
  return new Promise(function (resolve, reject) {
    var actualOutput = []
    stream.pipe(collect(actualOutput))
      .on('finish', function () {
        resolve(actualOutput);
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
