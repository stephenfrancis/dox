
const Log = require("loglevel").getLogger("dox.Location");
const Url = require("url");
const Utils = require("./Utils.js");


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
  }


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


  validateProps() {
    if (!this.repo_url) {
      throw new Error("'repo_url' must be defined");
    }
    if (this.path_array) {
      this.path = this.path_array.join("/");
    }
    if (typeof this.path !== "string") {
      throw new Error("'path' must be defined");
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
    this.path_array = Utils.getPathArray(this.path);
  }


  getParentLocation() {
    if (this.parent_location === undefined) {
      Log.debug("Location.getParentLocation(): " + this.path_array);
      if (this.path_array.length === 0) {
        this.parent_location = null;
      } else {
        this.parent_location = new Location({
          path_array: Utils.getParentPathArray(this.path_array),
          repo_url: this.repo_url,
          branch: this.branch,
          action: this.action,
        });
      }
    }
    return this.parent_location;
  }


  getRelativeURL() {
    return Utils.getFileFromPathArray(this.path_array);
  }


  getFullHash(href) {
    var path_array = this.path_array.slice(0);
    path_array = path_array.concat(Utils.getPathArray(href));
    Utils.normalizePathArray(path_array);
    Log.debug("Location.getFullHash(" + href + ") = " + path_array);
    return this.getFullHashFromRoot(path_array);
  }


  getFullHashFromRoot(path) {
    var new_url = "#repo_url=" + this.repo_url;
    if (this.branch) {
      new_url += "&branch=" + this.branch;
    }
    new_url += "&action=" + this.action;
    if (Array.isArray(path)) {
      path = path.join("/");
    }
    new_url += "&path=" + path;
    Log.debug("Location.getFullHashFromRoot(" + path + ") = " + new_url);
    return new_url;
  }
}
