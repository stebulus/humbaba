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

function expectFailure(test) {
  return function (callback) {
    runTest(test, function (err) {
      if (err)
        callback(null);
      else
        callback(new Error("expected failure, got success"));
    });
  };
}
exports.expectFailure = expectFailure;

function runTest(test, callback, timeout) {
  try {
    switch (test.length) {
      case 0:
        test();
        callback(null);
        break;
      case 1:
        var callbackEnabled = true;
        var callbackCalled = false;
        setTimeout(function () {
          callbackEnabled = false;
          if (!callbackCalled) {
            callback(new Error("test didn't call callback in time"));
          }
        }, timeout);
        test(function (err) {
          if (callbackEnabled) {
            callback(err);
            callbackCalled = true;
          } else {
            console.warn("callback called after it was disabled by timeout");
          }
        });
        break;
      default:
        throw new Error("I don't know how to run a test with arity " + test.length);
    }
  } catch (e) {
    callback(e);
  }
}
exports.runTest = runTest;

TEST_TIMEOUT = 1000;
exports.TEST_TIMEOUT = TEST_TIMEOUT;

function runTests(tests, keys, callback) {
  var failures = 0;
  function runNextTest(i) {
    console.log(keys[i]);
    runTest(tests[keys[i]], function (err) {
      if (err) {
        console.log("test fail");
        if (err.stack)
          console.log(err.stack);
        else
          console.log(err);
        failures++;
      }
      var next = i+1;
      if (next < keys.length)
        process.nextTick(function () { runNextTest(next); });
      else
        process.nextTick(function () { callback(failures); });
    }, TEST_TIMEOUT)
  }
  runNextTest(0);
}
exports.runTests = runTests;

function main(tests) {
  var testsToRun;
  if (process.argv.length <= 2) {
    testsToRun = Object.keys(tests);
    testsToRun.sort();
  } else {
    testsToRun = process.argv.slice(2);
  }
  runTests(tests, testsToRun, function (failures) {
    console.log("failures: " + failures);
    process.exit(failures);
  });
}
exports.main = main;
