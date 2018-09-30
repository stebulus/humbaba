function resolvesStrictSame(t, promise, expected, message) {
  return t.test(message,
    function (t) {
      return t.resolves(
        promise.then(function (result) {
          t.strictSame(result, expected, message);
        }),
        message
      )
    });
}
exports.resolvesStrictSame = resolvesStrictSame;
