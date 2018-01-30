/* globals window */

import React from "react";
import ReactDOM from "react-dom";
import Header from "./Header.js";
import Pane from "./Pane.js";
import Location from "./Location.js";

const Log = require("loglevel").getLogger("dox.App");
const IndexedDB = require("lapis/IndexedDB.js");
const IndexedDBAjaxStore = require("lapis/IndexedDBAjaxStore.js");

const idb_version = 1; // integer version sequence
// const npm_version = "0.1.0"; // TODO - get from package.json


require("loglevel").setLevel("debug");

class App extends React.Component {
  constructor(props) {
    super(props);
    const that = this;

    window.onhashchange = function () {
      Log.debug("window.onhashchange event");
      that.hashChange();
    };

    this.state = {
      location: new Location(window.location.href),
      ready: false,
    }
    this.setupStore(this.state.location.base_url);
  }


  hashChange () {
    const location = new Location(window.location.href);
    const ready = (this.state.location && (this.state.location.base_url === location.base_url));
    this.setState({
      location: location,
      ready: ready,
    });
    if (!ready) {
      this.setupStore(location.base_url);
    }
  }


  setupStore(base_url) {
    const that = this;
    const new_state = {};
    const database = new IndexedDB(window.indexedDB, "dox", idb_version);

    new_state.store = new IndexedDBAjaxStore(database, base_url,
      { keyPath: "uuid", },
      [
        {
          id: "by_title",
          key_path: "payload.title",
          additional: { unique: false, },
        },
      ], base_url);

    database.start()
      .then(function () {
        Log.debug("database started setting App.state.ready = true");
        new_state.ready = true;
        that.setState(new_state);
      })
      .then(null, function (err) {
        Log.error("App.start error: " + err);
      });
  }


  render() {
    var content;
    if (!this.state.ready) {
      content = (
        <p>Loading...</p>
      );
    } else if (this.state.location.action === "view") {
      content = this.renderView();
    } else if (this.state.location.action === "search") {
      content = this.renderSearch();
    } else if (this.state.location.action === "index") {
      content = this.renderIndex();
    } else {
      content = (
        <p>Invalid action!</p>
      );
    }
    return (
      <div>
        <Header location={this.state.location} />
        {content}
      </div>
    );
  }

  renderView() {
    var panes = [];
    var parent_location = this.state.location.getParentLocation();
    if (parent_location) {
      panes.push(<Pane location={parent_location}
        id="left" key="left" store={this.state.store} />);
    }
    panes.push(<Pane location={this.state.location}
      id="main" key="main" store={this.state.store} />);

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
