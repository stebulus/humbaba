/*
  Realize a humbaba graph as a duplex stream.

  Strings written into the stream are available to the program via
  runtime.GetChar; dually, the program's emissions via runtime.PutChar
  can be read out of the stream.
*/
var stream = require('stream');

var rt = require('./runtime');

function Stream(program) {
  var s = new stream.Duplex({ read, write, final });
  s.expr = program;
  s.stack = [];
  s.pendingChunk = null;
  s.pendingChunkIndex = null;
  s.pendingChunkCallback = null;
  s.okToEmit = false;
  s.noMoreChunks = false;
  s.finalCallback = null;
  s.advancing = false;
  return s;

  function intermediateResult(result) {
    var moreToDo;
    if (s.stack.length > 0) {
      s.expr = new rt.Apply(s.stack.pop(), [result]);
      moreToDo = true;
    } else {
      s.expr = null;
      s.push(null);
      if (s.pendingChunk)
        s.pendingChunkCallback(new Error("humbaba program ended"));
      if (s.finalCallback)
        s.finalCallback();
      moreToDo = false;
    }
    return moreToDo;
  }

  function advance() {
    if (s.advancing) {
      return;
    }
    s.advancing = true;
    var moreToDo;
    do {
      rt.evaluate(s.expr);
      s.expr = rt.smashIndirects(s.expr);
      switch (s.expr.tag) {
        case rt.IOPURE:
          moreToDo = intermediateResult(s.expr.fields[0]);
          break;
        case rt.IOBIND:
          s.stack.push(s.expr.fields[1]);
          s.expr = s.expr.fields[0];
          moreToDo = true;
          break;
        case rt.PUTCHAR:
          if (!s.okToEmit) {
            moreToDo = false;
          } else {
            var char = s.expr.fields[0];
            rt.evaluate(char);
            char = rt.smashIndirects(char);
            s.okToEmit = s.push(char.fields[0]);
            moreToDo = intermediateResult(rt.Unit);
          }
          break;
        case rt.GETCHAR:
          if (!s.pendingChunk) {
            moreToDo = false;
          } else {
            var char = s.pendingChunk.charAt(s.pendingChunkIndex++);
            moreToDo = intermediateResult(new rt.Box(char));
            if (s.pendingChunkIndex >= s.pendingChunk.length) {
              s.pendingChunk = null;
              s.pendingChunkIndex = null;
              var callback = s.pendingChunkCallback;
              s.pendingChunkCallback = null;
              callback();
            }
          }
          break;
        case rt.ISEOF:
          if (s.pendingChunk) {
            moreToDo = intermediateResult(rt.False);
          } else if (s.noMoreChunks) {
            moreToDo = intermediateResult(rt.True);
          } else {
            moreToDo = false;
          }
          break;
        default:
          throw new Error('weird tag ' + s.expr.tag);
      }
    } while (moreToDo);
    s.advancing = false;
  }

  function read() {
    s.okToEmit = true;
    advance();
  }

  function write(chunk, _encoding, callback) {
    if (s.pendingChunk)
      throw new Error("write() called while chunk pending");
    s.pendingChunk = chunk.toString();
    s.pendingChunkIndex = 0;
    s.pendingChunkCallback = callback;
    advance();
  }

  function final(callback) {
    s.noMoreChunks = true;
    s.finalCallback = callback;
    if (s.expr !== null) advance();
  }

}

exports.Stream = Stream;
