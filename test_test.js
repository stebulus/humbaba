var test = require('./test.js');

exports.tests = {}

exports.tests.sameNumbers = function () {
  test.assertSame(0, 0);
};

exports.tests.sameNumbersThrow = function () {
  var ok = false;
  try {
    test.assertNotSame(0, 0);
  } catch (e) {
    ok = true;
  }
  if (!ok) throw new Error("no exception thrown");
};

exports.tests.differentNumbers = function () {
  test.assertNotSame(0, 1);
};

exports.tests.differentNumbersThrow = function () {
  var ok = false;
  try {
    test.assertSame(0, 1);
  } catch (e) {
    ok = true;
  }
  if (!ok) throw new Error("no exception thrown");
};

exports.tests.differentTypes = function () {
  test.assertNotSame(1, '1');
  test.assertNotSame('1', 1);
};

exports.tests.sameArraysEmpty = function () {
  test.assertSame([], []);
};

exports.tests.sameArrays = function () {
  test.assertSame([1,2,3], [1,2,3]);
};

exports.tests.differentArraysEmptyAndNot = function () {
  test.assertNotSame([1,2,3], []);
  test.assertNotSame([], [1,2,3]);
};

exports.tests.differentArraysOrder = function () {
  test.assertNotSame([1,2,3], [3,2,1]);
};

exports.tests.differentArraysSubsequence = function () {
  test.assertNotSame([1,2,3], [1,2,3,4]);
  test.assertNotSame([1,2,3,4], [1,2,3]);
};

exports.tests.sameObject = function () {
  test.assertSame({a: 1, b: 2}, {a: 1, b: 2});
};

exports.tests.sameObjectEmpty = function () {
  test.assertSame({}, {});
};

exports.tests.differentObjectEmptyAndNot = function () {
  test.assertNotSame({a: 1, b: 2}, {});
  test.assertNotSame({}, {a: 1, b: 2});
};

exports.tests.differentObjectKeys = function () {
  test.assertNotSame({a: 1, b: 2}, {a: 1, bee: 2});
};

exports.tests.differentObjectValues = function () {
  test.assertNotSame({a: 1, b: 2}, {a: 1, b: 'two'});
};

exports.tests.sameObjectWithArrays = function () {
  test.assertSame({a: [1,2,3], b: [4,5,6]}, {a: [1,2,3], b: [4,5,6]});
};

exports.tests.differentObjectWithArrays = function () {
  test.assertNotSame({a: [1,2,3], b: [4,5,6]}, {a: [1,2,3], b: [4,5,7]});
};

if (require.main === module)
  process.exit(test.runTests(exports.tests));
