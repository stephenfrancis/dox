/* globals window */

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RootLog from "loglevel";
import * as _ from "underscore";
import Header from "./Header";
import AdjustablePane from "./AdjustablePane";
import Pane from "./Pane";
import Location from "./Location";
import * as IndexedDB from "lapis/IndexedDB";
import * as IndexedDBAjaxStore from "lapis/IndexedDBAjaxStore";

const Log = RootLog.getLogger("dox.App");
const idb_version = 1; // integer version sequence

RootLog.setLevel("debug");


interface Props {}

interface State {
  action: string;
  location: Location;
  ready: boolean;
  store?: IndexedDBAjaxStore;
}

class App extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const that = this;

    window.onhashchange = function () {
      Log.debug("window.onhashchange event");
      that.hashChange();
    };

    this.state = {
      action: "view",
      location: new Location(window.location.href),
      ready: false,
    } as State;
    this.setupStore(this.state.location.getBaseURL());
  }


  changeAction(action: string) {
    this.setState({
      action: action,
    });
  }


  hashChange() {
    const location = new Location(window.location.href);
    const ready = (this.state.location && (this.state.location.getBaseURL() === location.getBaseURL()));
    this.setState({
      action: "view",
      location: location,
      ready: ready,
    });
    if (!ready) {
      this.setupStore(location.getBaseURL());
    }
  }


  render() {
    var content;
    if (!this.state.ready) {
      content = (
        <div className="message">Loading...</div>
      );
    } else if (this.state.action === "view") {
      content = this.renderView();
    } else if (this.state.action === "search") {
      content = this.renderSearch();
    } else if (this.state.action === "info") {
      content = this.renderInfo();
    } else {
      content = (
        <div className="message">Invalid action! {this.state.action}</div>
      );
    }
    return (
      <div>
        <Header location={this.state.location} changeAction={this.changeAction.bind(this)} />
        {content}
      </div>
    );
  }

  renderView() {
    var panes = [];
    var parent_location = this.state.location.getParentLocation();
    if (parent_location) {
      panes.push(
        <AdjustablePane key="left">
          <Pane
            store={this.state.store}
            location={parent_location}
            highlight_link={this.state.location}
          />
        </AdjustablePane>
      );
    }
    panes.push(
      <div id="main_pane" key="main">
        <Pane
          store={this.state.store}
          location={this.state.location}
        />
      </div>
    );

    return (
      <div id="container" style={{ display: "flex", flexDirection: "row", }}>
        {panes}
      </div>
    );
  }


  renderSearch() {
  }


  renderInfo() {
  }


  setupStore(base_url: string) {
    const that = this;
    const new_state = {} as State;
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
        Log.debug("database started setting App.state.ready = true, base_url = " + base_url);
        new_state.ready = true;
        that.setState(new_state);
      })
      .then(null, function (err) {
        Log.error("App.start error: " + err);
      });
  }

}


ReactDOM.render(<App />,
  window.document.getElementById("app_dynamic"));
