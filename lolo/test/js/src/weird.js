var codegen = require('../../../codegen');
var t = require('tap');

t.throws(function () {
  codegen.expr({'weird': 3}, function () {});
}, /weird/, 'throw for objects without any of the expected keys');

t.throws(function () {
  codegen.expr({'casei': 3, 'of': [[3, 3], [[1661], 3]]}, function () {});
}, /weird/, 'throw for casei with nonliteral matcher');

t.throws(function () {
  codegen.module({'declarations': [
    {'weird': 3}
  ]}, function () {});
}, /weird/, 'throw for declarations without any of the expected keys');
