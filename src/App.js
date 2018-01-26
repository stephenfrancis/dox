
import React from "react";
import ReactDOM from "react-dom";
import Header from "./Header.js";
import Pane from "./Pane.js";

const Log = require("loglevel").getLogger("dox.App");
const Url = require("url");
const IndexedDB = require("lapis/indexedDB.js");
const IndexedDBAjaxStore = require("lapis/IndexedDBAjaxStore.js");

const idb_version = 1; // integer version sequence
const npm_version = "0.1.0"; // TODO - get from package.json


require("loglevel").setLevel("debug");

class App extends React.Component {
  constructor(props) {
    super(props);
    const that = this;
    const url = Url.parse(window.location.href);
    const current_repo = url.pathname.match(/^\/(.*?)\//)[1];
    const database = new IndexedDB(window.indexedDB, current_repo, idb_version);
    const store = new IndexedDBAjaxStore(database, "dox",
      { keyPath: "uuid", },
      [
        {
          id: "by_title",
          key_path: "payload.title",
          additional: { unique: false },
        },
      ], url.protocol + "//" + url.host + "/" + current_repo + "/");

    window.onhashchange = function () {
      that.hashChange();
    };

    database.start()
      .then(function () {
        Log.debug("database started setting App.state.ready = true");
        that.setState({
          ready: true, // state change to force a re-render...
        });
      })
      .then(null, function (err) {
        Log.error("App.start error: " + err);
      });

    this.state = {
      current_repo: current_repo,
      store: store,
      caching: true,
      ready: false,
      action: "view",
      path_array: [],
    }
  }

  processFragment(hash) {
    var params = {
      action: "view",
    };
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
        params[parts[0]] = decodeURIComponent(parts[1]);
      } else if (!params.path) { // interpret a param without '=' as a path
        params.path = parts[0]; // if path not already specified
      }
    });
    return params;
  }


  hashChange () {
    var hash = Url.parse(window.location.href).hash || "";
    var params = this.processFragment(hash);
    if (params.path) {
      params.path_array = this.getPathArray(params.path);
      if (params.path_array.length > 0) {
        params.parent_path_array = params.path_array.slice(0, params.path_array.length - 1);
      }
    }
    this.setState(params);
  }


  getPathArray(path_arg) {
    var path_arr;
    path_arg = path_arg || "";
    path_arr = path_arg.split("/");
    this.normalizePathArray(path_arr);
    if (path_arr[path_arr.length - 1] === "README.md") {
      path_arr.pop();
    }
    Log.debug("getPathArray(" + path_arg + "): " + path_arr);
    return path_arr;
  }


  normalizePathArray(path_arr, addl_path_arr) {
    var i = 0;
    if (addl_path_arr) {
      path_arr = path_arr.concat(addl_path_arr);
    }
    while (i < path_arr.length) {
      if (path_arr[i] === ".." && i > 0) {
        path_arr.splice(i - 1, 2);            // remove this dir element and previous one
        i -= 1;
      } else if (path_arr[i] === "." || path_arr[i] === "") {
        path_arr.splice(i, 1);                // remove this dir element if not last
      } else {
        i += 1;
      }
    }
    return path_arr;
  }


  getFullPath(path_array, alt_filename) {
    var out = path_array.join("/");
    if (alt_filename) {
      out += (out ? "/" : "") + alt_filename;
    }
    if (!this.isFile(path_array, alt_filename)) {
      out += (out ? "/" : "") + "README.md";
    }
    return out;
  }


  isFile(path_array, alt_filename) {
    var regex = /\.[a-zA-Z]{2,4}$/;
    if (alt_filename) {
      return !!alt_filename.match(regex);
    }
    if (path_array.length < 1) {
      return false;
    }
    return !!(path_array[path_array.length - 1].match(regex));        // has a 2-4 char extension
  }


  render() {
    var content;
    if (!this.state.ready) {
      content = (
        <p>Loading...</p>
      );
    } else if (this.state.action === "view") {
      content = this.renderView();
    } else if (this.state.action === "search") {
      content = this.renderSearch();
    } else if (this.state.action === "index") {
      content = this.renderIndex();
    } else {
      content = (
        <p>Invalid action!</p>
      );
    }
    return (
      <div>
        <Header />
        {content}
      </div>
    );
  }

  renderView() {
    var panes = [];
    if (this.state.parent_path_array) {
      panes.push(<Pane id="left" key="left" store={this.state.store} path={this.getFullPath(this.state.parent_path_array)} />);
    }
    panes.push(<Pane id="left" key="main" store={this.state.store} path={this.getFullPath(this.state.path_array)} />);
    return (
      <div id="container" style={{ display: "flex", flexDirection: "row" }}>
        {panes}
      </div>
    );
  }


  renderSearch() {
  }


  renderIndex() {
  }

}


ReactDOM.render(<App />,
  window.document.getElementById("app_dynamic"));
