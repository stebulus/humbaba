/*
  Realize a humbaba graph as a duplex stream.

  Strings written into the stream are available to the program via
  runtime.GetChar; dually, the program's emissions via runtime.PutChar
  can be read out of the stream.
*/
var debugRT = require('debug')('humbaba:runtime');
var debugIO = require('debug')('humbaba:io');
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
    debugRT('intermediateResult %s', rt.nodeType(result));
    var moreToDo;
    if (s.stack.length > 0) {
      s.expr = new rt.Apply(s.stack.pop(), [result]);
      moreToDo = true;
    } else {
      debugRT('program ending');
      s.expr = null;
      process.nextTick(function () {
        debugRT('closing stdout');
        s.push(null);
      });
      if (s.pendingChunk) {
        process.nextTick(s.pendingChunkCallback,
          new Error("humbaba program ended"));
      }
      if (s.finalCallback)
        process.nextTick(s.finalCallback);
      moreToDo = false;
    }
    return moreToDo;
  }

  function advance() {
    if (s.advancing) {
      debugRT('advance shortcircuit');
      return;
    } else if (!s.expr) {
      debugRT('not advancing, because program is ending');
      return;
    }
    debugRT('advance');
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
            debugIO('putchar stall');
            moreToDo = false;
          } else {
            var char = s.expr.fields[0];
            rt.evaluate(char);
            char = rt.smashIndirects(char);
            process.nextTick(function (c) {
              debugIO('putchar %j', char.fields[0]);
              s.okToEmit = s.push(c);
            }, char.fields[0]);
            moreToDo = intermediateResult(rt.Unit);
          }
          break;
        case rt.GETCHAR:
          if (!s.pendingChunk) {
            debugIO('getchar stall');
            moreToDo = false;
          } else {
            var char = s.pendingChunk.charAt(s.pendingChunkIndex++);
            debugIO('getchar %j', char);
            moreToDo = intermediateResult(new rt.Box(char));
            if (s.pendingChunkIndex >= s.pendingChunk.length) {
              s.pendingChunk = null;
              s.pendingChunkIndex = null;
              process.nextTick(s.pendingChunkCallback);
              s.pendingChunkCallback = null;
            }
          }
          break;
        case rt.ISEOF:
          if (s.pendingChunk) {
            debugIO('iseof false');
            moreToDo = intermediateResult(rt.False);
          } else if (s.noMoreChunks) {
            debugIO('iseof true');
            moreToDo = intermediateResult(rt.True);
          } else {
            debugIO('iseof stall');
            moreToDo = false;
          }
          break;
        default:
          throw new Error('weird tag in: ' + JSON.stringify(s.expr));
      }
    } while (moreToDo);
    s.advancing = false;
  }

  function read() {
    debugRT('reading on stdout');
    s.okToEmit = true;
    advance();
  }

  function write(chunk, _encoding, callback) {
    debugRT('writing %d to stdin', chunk.length);
    if (s.pendingChunk)
      throw new Error("write() called while chunk pending");
    s.pendingChunk = chunk.toString();
    s.pendingChunkIndex = 0;
    s.pendingChunkCallback = callback;
    advance();
  }

  function final(callback) {
    debugRT('closing stdin');
    s.noMoreChunks = true;
    s.finalCallback = callback;
    advance();
  }

}

exports.Stream = Stream;
