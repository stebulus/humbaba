var rt = require('../humbaba-runtime');
var test = require('./lib/test');
var test_codegen = require('./lolo_codegen');

tests = {

  charOrd() {
    test.assertSame(new rt.Box(97),
      test_codegen.programValue({"declarations":
        [ {"import": "Prim.Char"},
          {"func": ["test"], "=":
            ["Prim.Char.ord", {"str": "a"}]}
        ]
      })
    );
  },

}

exports.tests = tests;

if (require.main === module)
  test.main(tests);
