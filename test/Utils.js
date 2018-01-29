
const Utils = require("../src/Utils.js");


module.exports.main = function (test) {
  test.expect(22);

  test.ok(!Utils.appearsToBeAFile("foo"), "foo doesn't appear to be a file");
  test.ok(!Utils.appearsToBeAFile("foo/"), "foo/ doesn't appear to be a file");
  test.ok(!Utils.appearsToBeAFile("/foo/bar"), "/foo/bar doesn't appear to be a file");
  test.ok(Utils.appearsToBeAFile("foo.md"), "foo.md appears to be a file");
  test.ok(Utils.appearsToBeAFile("foo.png"), "foo.png appears to be a file");
  test.ok(Utils.appearsToBeAFile("foo/bar.md"), "foo/bar.md appears to be a file");
  test.ok(Utils.appearsToBeAFile([ "foo", "/bar.md", ]), "foo/bar.md appears to be a file");
  test.deepEqual(Utils.getPathArray("foo/bar"), [ "foo", "bar", ], "getPathArray(foo/bar) to [ foo, bar ]");
  test.deepEqual(Utils.getPathArray("foo"), [ "foo", ], "getPathArray(foo) to [ foo ]");
  test.deepEqual(Utils.getPathArray(""), null, "getPathArray() to null");
  test.deepEqual(Utils.normalizePathArray([ "foo", "bar", ]), [ "foo", "bar" ], "normalizePathArray(foo, bar) = foo, bar");
  test.deepEqual(Utils.normalizePathArray([ "foo", "..", "bar", ]), [ "bar" ], "normalizePathArray(foo, .., bar) = bar");
  test.deepEqual(Utils.normalizePathArray([ "foo", ".", "bar", ]), [ "foo", "bar" ], "normalizePathArray(foo, ., bar) = foo, bar");
  test.deepEqual(Utils.normalizePathArray([ "foo", "..", ]), [], "normalizePathArray(foo, ..)");
  test.deepEqual(Utils.regularizePathArray([ "foo", ]), [ "foo" ], "regularizePathArray(foo)");
  test.deepEqual(Utils.regularizePathArray([ "foo", "README.md", ]), [ "foo", ], "regularizePathArray(foo, README.md)");
  test.deepEqual(Utils.regularizePathArray([ "README.md", ]), [], "regularizePathArray(README.md)");
  test.deepEqual(Utils.regularizePathArray([ "foo", "blah.md", ]), [ "foo", "blah.md", ], "regularizePathArray(foo, blah.md)");
  test.deepEqual(Utils.deRegularizePathArray([ "foo", ]), [ "foo", "README.md", ], "deRegularizePathArray(foo)");
  test.deepEqual(Utils.deRegularizePathArray([ "foo", "blah.md", ]), [ "foo", "blah.md", ], "deRegularizePathArray(foo, blah.md)");
  test.deepEqual(Utils.deRegularizePathArray([ "blah.md", ]), [ "blah.md", ], "deRegularizePathArray(blah.md)");
  test.deepEqual(Utils.deRegularizePathArray([ "foo", "blah", ]), [ "foo", "blah", "README.md", ], "deRegularizePathArray(foo, blah)");
  test.done();
}
