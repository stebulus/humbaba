var cat = require('../../lib/cat-runtime');
var rts = require('../../../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');

var s = new rts.Stream(cat.program);
var blackhole = new stream.Writable({ write() {} });
s.pipe(blackhole);

t.resolves(new Promise(function (resolve, reject) {
  s.end('x', function (err) {
    if (err) reject(err); else resolve(err);
  });
}), 'final callback is called');
