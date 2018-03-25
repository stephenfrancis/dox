
const Utils = require("../src/Utils.js").default;


module.exports.main = function (test) {
  test.expect(6);

  test.ok(!Utils.appearsToBeAFile("foo"), "foo doesn't appear to be a file");
  test.ok(!Utils.appearsToBeAFile("foo/"), "foo/ doesn't appear to be a file");
  test.ok(!Utils.appearsToBeAFile("/foo/bar"), "/foo/bar doesn't appear to be a file");
  test.ok(Utils.appearsToBeAFile("foo.md"), "foo.md appears to be a file");
  test.ok(Utils.appearsToBeAFile("foo.png"), "foo.png appears to be a file");
  test.ok(Utils.appearsToBeAFile("foo/bar.md"), "foo/bar.md appears to be a file");
  test.done();
}
