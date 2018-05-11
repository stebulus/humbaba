function exprToExpr(code, chunk) {
  chunk('new rt.Box(' + code + ')');
}

module.exports.exprToExpr = exprToExpr;
