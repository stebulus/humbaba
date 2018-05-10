var util = require('util');

function same(a, b) {
  if (Array.isArray(a)) {
    return Array.isArray(b) && sameEntries(a, b);
  } else if (typeof a === 'object') {
    return Object.is(a, b)
      || (typeof b === 'object'
          && samePrototype(a, b)
          && sameEntries(properties(a), properties(b)));
  } else {
    return a === b;
  }
}

function samePrototype(a, b) {
  var aproto = Object.getPrototypeOf(a);
  var bproto = Object.getPrototypeOf(b);
  return Object.is(aproto, bproto);
}

function sameEntries(a, b) {
  if (a.length !== b.length)
    return false;
  for (var i = 0; i < a.length; i++) {
    if (!same(a[i], b[i]))
      return false;
  }
  return true;
}

function properties(obj) {
  var ents = [];
  for (var k in obj)
    ents.push([k, obj[k]]);
  ents.sort();
  return ents;
}

function assertSame(expected, actual) {
  if (!same(expected, actual))
    throw new Error("expected same as: "
      + util.inspect(expected)
      + "\nactual: "
      + util.inspect(actual))
}
exports.assertSame = assertSame;

function assertNotSame(notExpected, actual) {
  if (same(notExpected, actual))
    throw new Error("expected different from: "
      + util.inspect(notExpected)
      + "\nactual: "
      + util.inspect(actual))
}
exports.assertNotSame = assertNotSame;

function runTests(tests) {
  var keys = Object.keys(tests);
  keys.sort();
  var failures = 0;
  for (var i = 0; i < keys.length; i++) {
    try {
      tests[keys[i]]()
      console.log("test ok " + keys[i]);
    } catch (e) {
      console.log("test fail " + keys[i]);
      if (e.stack)
        console.log(e.stack);
      else
        console.log(e);
      failures++;
    }
  }
  console.log("tests: " + keys.length);
  console.log("failures: " + failures);
  return failures;
}
exports.runTests = runTests;
