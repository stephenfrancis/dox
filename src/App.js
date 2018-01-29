/* globals window */

import React from "react";
import ReactDOM from "react-dom";
import Header from "./Header.js";
import Pane from "./Pane.js";

const Log = require("loglevel").getLogger("dox.App");
const Url = require("url");
const Utils = require("./Utils.js");
const IndexedDB = require("lapis/IndexedDB.js");
const IndexedDBAjaxStore = require("lapis/IndexedDBAjaxStore.js");

const idb_version = 1; // integer version sequence
// const npm_version = "0.1.0"; // TODO - get from package.json


require("loglevel").setLevel("debug");

class App extends React.Component {
  constructor(props) {
    super(props);
    const that = this;
    const url = Url.parse(window.location.href);
    const current_repo = url.pathname.match(/^\/(.*?)\//)[1];
    const database = new IndexedDB(window.indexedDB, current_repo, idb_version);
    this.local_url = url.protocol + "//" + url.host + "/" + current_repo + "/";
    const store = new IndexedDBAjaxStore(database, "dox",
      { keyPath: "uuid", },
      [
        {
          id: "by_title",
          key_path: "payload.title",
          additional: { unique: false, },
        },
      ], this.local_url);

    window.onhashchange = function () {
      Log.debug("window.onhashchange event");
      that.hashChange();
    };

    this.state = {
      current_repo: current_repo,
      path_array: [],
      store: store,
      caching: true,
      ready: false,
    }

    database.start()
      .then(function () {
        Log.debug("database started setting App.state.ready = true");
        that.hashChange();
        that.setState({
          ready: true, // state change to force a re-render...
        });
      })
      .then(null, function (err) {
        Log.error("App.start error: " + err);
      });
  }


  processFragment(hash) {
    var params = {};
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
    params.action = params.action || "view";
    if (params.action === "view") {
      params.path = params.path || "";
      params.path_array = Utils.getPathArray(params.path);
      params.parent_path_array = Utils.getParentPathArray(params.path_array);
    }
    this.state.store.server_url = params.remote || this.local_url; // eslint-disable-line
    Log.debug("App.hashChange params: " + JSON.stringify(params));
    this.setState(params);
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
        <Header current_repo={this.state.current_repo} path_array={this.state.path_array} />
        {content}
      </div>
    );
  }

  renderView() {
    var panes = [];
    if (this.state.parent_path_array) {
      panes.push(<Pane path_array={this.state.parent_path_array}
        id="left" key="left" store={this.state.store} remote={this.state.remote} />);
    }
    panes.push(<Pane path_array={this.state.path_array}
      id="main" key="main" store={this.state.store} remote={this.state.remote} />);

    return (
      <div id="container" style={{ display: "flex", flexDirection: "row", }}>
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
