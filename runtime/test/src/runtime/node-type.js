var rt = require('../../../humbaba-runtime');
var t = require('tap');

function composeApply(f, g, x) {
  rt.Apply.call(this, f, new rt.Apply(g, x));
}

function identity(x) {
  rt.Indirect.call(x);
}

t.match(rt.nodeType(new rt.Data(1, [])), /^data/);

var pap = new rt.Apply(new rt.Box(composeApply), [identity]);
t.match(rt.nodeType(pap), /^thunk/);
rt.evaluate(pap);
t.match(rt.nodeType(pap), /^pap/);

t.match(rt.nodeType(new rt.Indirect(rt.True)), /^\*data/);

var weird = new rt.Empty();
weird.type = -3;
weird.tag = 0;
weird.fields = [];
t.match(rt.nodeType(weird), /^unknown/);
