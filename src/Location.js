
const Log = require("loglevel").getLogger("dox.Location");
const Url = require("url");
// const Utils = require("./Utils.js");
const Path = require("path");

/**
 * @typedef {Object} Location - Represents a folder or markdown document within a hosted Git repo
 * @property {string} repo_url - full URL of the hosted Git repo, the last path element being the
 *  repo name
 * @property {string} repo_name - the derived name of the repo, from the last path element of
 *  repo_url
 * @property {string} path - directory path of the folder or markdown document within the repo
 * @property {string} branch - (optional) the published branch, added to base_url if specified
 * @property {string} base_url - used to derive the URL of documents in the repo, being the
 *  repo_url + (if specified) branch
 */

export default class Location {
  constructor (arg) {
    const that = this;
    if (typeof arg === "string") {
      this.interpretURL(arg);
    } else {
      Object.keys(arg).forEach(function (param_id) {
        that[param_id] = arg[param_id];
      });
    }
    this.validateProps();
    Log.debug("Location created: " + JSON.stringify(this));
  }

  /**
   * @function @private Sets object properties from a string URL
   * @param {string} href - URL used to set properties using getFragmentProps()
   */
  interpretURL(href) {
    const url = Url.parse(href);
    this.getFragmentProps(url.hash || "");
    if (!this.repo_url) {
      this.repo_url = url.protocol + "//" + url.host + url.path.substr(0, url.path.lastIndexOf("/"));
    }
    if (!this.path) {
      this.path = "";
    }
  }

  /**
   * @function @private Sets properties of this object from the hash
   * @param {object} hash - unpacked from the fragment part of the URL
   */
  getFragmentProps(hash) {
    const that = this;
    var pairs;
    if (hash) {
      hash = hash.substr(1);
    } else {
      hash = "";
    }
    pairs = hash.split("&");
    pairs.forEach(function (pair) {
      var parts = pair.split("=");
      if (parts.length > 1) {
        that[parts[0]] = decodeURIComponent(parts[1]);
      } else if (!that.path) { // interpret a param without '=' as a path
        that.path = parts[0]; // if path not already specified
      }
    });
  }

  /**
   * @function @private Validate properties repo_url, path; derive path,
   *  and repo_name, and base_url from them
   */
  validateProps() {
    if (!this.repo_url) {
      throw new Error("'repo_url' must be defined");
    }
    if (typeof this.path !== "string") {
      throw new Error("'path' must be defined");
    }
    if (Path.basename(this.path) === "README.md") {
      this.path = Path.resolve(this.path, "..");
    }
    this.path = Path.normalize(this.path);
    if (this.path === ".") {
      this.path = "";
    }
    // strip any trailing slash
    if (this.repo_url.substr(-1) === "/") {
      this.repo_url = this.repo_url.substr(0, (this.repo_url.length - 1));
    }
    this.base_url = this.repo_url + "/"; // append trailing slash!
    if (this.branch) {
      this.base_url += this.branch + "/";
    }
    this.repo_name = this.repo_url.substr(this.repo_url.lastIndexOf("/") + 1);
  }


  getParentLocation() {
    if (!this.path) {
      return null;
    }
    if (this.parent_location === undefined) {
      Log.debug("Location.getParentLocation(): " + this.path_array);
      this.parent_location = new Location({
        path: Path.resolve(this.path, ".."),
        repo_url: this.repo_url,
        branch: this.branch,
        action: this.action,
      });
    }
    return this.parent_location;
  }


  appearsToBeAFile(path) {
    return !!Path.extname(path || this.path);
  }


  isMarkdownFile(path) {
    return (Path.extname(path || this.path) === ".md");
  }


  getSourceFileURL() {
    var out = this.path;
    if (!this.appearsToBeAFile()) {
      out += "/README.md";
    }
    return Path.normalize(out);
  }


  getFullPathFromRelative(path) {
    return Path.resolve(this.path, path);
  }


  getHash(path) {
    var new_url = "#repo_url=" + this.repo_url;
    if (this.branch) {
      new_url += "&branch=" + this.branch;
    }
    new_url += "&action=" + this.action;
    new_url += "&path=" + path;
    return new_url;
  }


  splitPath(path) {
    const array = (path || this.path).split("/");
    let i = 0;
    while (i < array.length) {
      if (array[i]) {
        i += 1;
      } else {
        array.splice(i, 1);
      }
    }
    return array;
  }

}
