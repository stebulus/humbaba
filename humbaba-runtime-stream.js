var debugRT = require('debug')('humbaba:runtime');
var debugIO = require('debug')('humbaba:io');
var stream = require('stream');

var rt = require('./humbaba-runtime');

/*
  Realize a humbaba graph as a duplex stream.

  Strings written into the stream are available to the program via
  runtime.GetChar; dually, the program's emissions via runtime.PutChar
  can be read out of the stream.

  If you want to use a stream.Readable as a humbaba program's stdin,
  don't do readable.pipe(Stream(program)).  Instead, do Stream(program,
  readable).  Rationale: readable.pipe reads data from the readable
  whether or not the humbaba program actually consumes it, which can
  result in loss of data.  When a readable stream is passed as the
  second argument to Stream, it will start piping only if and when
  the program actually tries to read from stdin.
*/
function Stream(program, stdin) {
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
  s.stdin = stdin;
  s.stdinActive = false;
  s.closed = false;
  return s;

  function intermediateResult(result) {
    debugRT('intermediateResult %s', rt.nodeType(result));
    var moreToDo;
    if (s.stack.length > 0) {
      s.expr = new rt.Apply(s.stack.pop(), [result]);
      moreToDo = true;
    } else {
      s.expr = null;
      moreToDo = false;
    }
    return moreToDo;
  }

  function ensureStdinActive() {
    if (!s.stdinActive && s.stdin) {
      s.stdinActive = true;
      s.stdin.pipe(s);
    }
  }

  function finishPendingWrite(err) {
    s.pendingChunk = null;
    s.pendingChunkIndex = null;
    process.nextTick(s.pendingChunkCallback, err);
    s.pendingChunkCallback = null;
  }

  function advance() {
    if (s.advancing) {
      debugRT('advance shortcircuit');
      return;
    }
    debugRT('advance');
    s.advancing = true;
    var moreToDo = s.expr != null;
    while (moreToDo) {
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
              debugIO('putchar %j', c);
              s.okToEmit = s.push(c);
            }, char.fields[0]);
            moreToDo = intermediateResult(rt.Unit);
          }
          break;
        case rt.GETCHAR:
          if (!s.pendingChunk) {
            debugIO('getchar stall');
            ensureStdinActive();
            moreToDo = false;
          } else {
            var char = s.pendingChunk.charAt(s.pendingChunkIndex++);
            debugIO('getchar %j', char);
            moreToDo = intermediateResult(new rt.Box(char));
            if (s.pendingChunkIndex >= s.pendingChunk.length)
              finishPendingWrite();
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
            ensureStdinActive();
            moreToDo = false;
          }
          break;
        default:
          throw new Error('weird tag in: ' + JSON.stringify(s.expr));
      }
    }
    if (!s.expr) {
      debugRT('program ending');
      process.nextTick(function () {
        if (!s.closed) {
          debugRT('closing stdout');
          s.push(null);
          s.closed = true;
        }
      });
      if (s.pendingChunk)
        finishPendingWrite(new Error("could not write input to humbaba program, because it ended"));
      if (s.finalCallback) {
        process.nextTick(s.finalCallback);
        s.finalCallback = null;
      }
    }
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
      throw new Error("_write() was called again before the previous call's callback was invoked, which violates the protocol between stream.Writable and this function");
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
