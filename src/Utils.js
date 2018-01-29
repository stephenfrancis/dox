
const Log = require("loglevel").getLogger("dox.Utils");


module.exports.appearsToBeAFile = function (path) {
  var regex = /\.[a-zA-Z]{2,4}$/;
  if (Array.isArray(path)) {
    path = path[path.length - 1]; // use final element of array if is array
  }
  return !!path.match(regex); // has a 2-4 char extension
  // var regex = /\/$/;
  // return !!path.match(regex); // ends with a slash
};


module.exports.isRelativePath = function (path) {
  return (path.indexOf(":") === -1
    && path.indexOf("#") !== 0
    && path.indexOf("/") !== 0
    && path.indexOf("\\") !== 0);
};


module.exports.isMarkdownFile = function (path) {
  return (!!path.match(/\.md$/));
};


module.exports.getPathArray = function (path) {
  var path_arr;
  if (!path) {
    path_arr = [];
  } else {
    path_arr = path.split("/");
    this.normalizePathArray(path_arr);
  }
  Log.debug("getPathArray(" + path + "): " + path_arr);
  if (!Array.isArray(path_arr)) {
    throw new Error("not an array: " + path_arr);
  }
  return path_arr;
};


// 'normalize' = convert to a canonical path - remove '.' and '..' elements
module.exports.normalizePathArray = function (path_arr) {
  var i = 0;
  if (!Array.isArray(path_arr)) {
    throw new Error("not an array: " + path_arr);
  }
  while (i < path_arr.length) {
    if (path_arr[i] === ".." && i > 0) {
      path_arr.splice(i - 1, 2); // remove this dir element and previous one
      i -= 1;
    } else if (path_arr[i] === "." || path_arr[i] === "") {
      path_arr.splice(i, 1); // remove this dir element if not last
    } else {
      i += 1;
    }
  }
  return path_arr;
};


// remove 'README.md' if is the final path element
module.exports.regularizePathArray = function (path_arr) {
  path_arr = path_arr.slice();
  this.normalizePathArray(path_arr);
  if (path_arr.length > 0 && path_arr[path_arr.length - 1] === "README.md") {
    path_arr.splice(path_arr.length -1, 1);
  }
  return path_arr;
};


// add 'README.md' if path appears to be a directory
module.exports.deRegularizePathArray = function (path_arr) {
  path_arr = path_arr.slice();
  this.normalizePathArray(path_arr);
  if (path_arr.length === 0 || !this.appearsToBeAFile(path_arr)) {
    path_arr.push("README.md");
  }
  return path_arr;
};


module.exports.getFileFromPathArray = function (path_arr) {
  Log.debug("getFileFromPathArray(): " + path_arr);
  path_arr = this.deRegularizePathArray(path_arr);
  return path_arr.join("/");
};


module.exports.getParentPathArray = function (path_arr) {
  var parent_path_arr;
  if (!Array.isArray(path_arr)) {
    throw new Error("not an array: " + path_arr);
  }
  parent_path_arr = path_arr.slice(0);

  if (parent_path_arr.length == 0) {
    parent_path_arr = null;
  } else {
    parent_path_arr.pop();
  }
  return parent_path_arr;
}
