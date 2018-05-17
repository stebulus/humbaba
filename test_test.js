var test = require('./test.js');

tests = {

  sameNumbers() {
    test.assertSame(0, 0);
  },

  sameNumbersThrow() {
    var ok = false;
    try {
      test.assertNotSame(0, 0);
    } catch (e) {
      ok = true;
    }
    if (!ok) throw new Error("no exception thrown");
  },

  differentNumbers() {
    test.assertNotSame(0, 1);
  },

  differentNumbersThrow() {
    var ok = false;
    try {
      test.assertSame(0, 1);
    } catch (e) {
      ok = true;
    }
    if (!ok) throw new Error("no exception thrown");
  },

  differentTypes() {
    test.assertNotSame(1, '1');
    test.assertNotSame('1', 1);
  },

  sameArraysEmpty() {
    test.assertSame([], []);
  },

  sameArrays() {
    test.assertSame([1,2,3], [1,2,3]);
  },

  differentArraysEmptyAndNot() {
    test.assertNotSame([1,2,3], []);
    test.assertNotSame([], [1,2,3]);
  },

  differentArraysOrder() {
    test.assertNotSame([1,2,3], [3,2,1]);
  },

  differentArraysSubsequence() {
    test.assertNotSame([1,2,3], [1,2,3,4]);
    test.assertNotSame([1,2,3,4], [1,2,3]);
  },

  sameObject() {
    test.assertSame({a: 1, b: 2}, {a: 1, b: 2});
  },

  sameObjectEmpty() {
    test.assertSame({}, {});
  },

  differentObjectEmptyAndNot() {
    test.assertNotSame({a: 1, b: 2}, {});
    test.assertNotSame({}, {a: 1, b: 2});
  },

  differentObjectKeys() {
    test.assertNotSame({a: 1, b: 2}, {a: 1, bee: 2});
  },

  differentObjectValues() {
    test.assertNotSame({a: 1, b: 2}, {a: 1, b: 'two'});
  },

  sameObjectWithArrays() {
    test.assertSame({a: [1,2,3], b: [4,5,6]}, {a: [1,2,3], b: [4,5,6]});
  },

  differentObjectWithArrays() {
    test.assertNotSame({a: [1,2,3], b: [4,5,6]}, {a: [1,2,3], b: [4,5,7]});
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
