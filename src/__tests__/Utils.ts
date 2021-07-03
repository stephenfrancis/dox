import Utils from "../app/Utils";

test("utils", () => {
  expect(Utils.appearsToBeAFile("foo")).toBe(false); // foo doesn't appear to be a file
  expect(Utils.appearsToBeAFile("foo/")).toBe(false); // foo/ doesn't appear to be a file
  expect(Utils.appearsToBeAFile("/foo/bar")).toBe(false); // /foo/bar doesn't appear to be a file

  expect(Utils.appearsToBeAFile("foo.md")).toBe(true); // foo.md appears to be a file
  expect(Utils.appearsToBeAFile("foo.png")).toBe(true); // foo.png appears to be a file
  expect(Utils.appearsToBeAFile("foo/bar.md")).toBe(true); //foo/bar.md appears to be a file
});
