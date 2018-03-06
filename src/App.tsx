/* globals window */

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RootLog from "loglevel";
import * as _ from "underscore";
import AdjustablePane from "./AdjustablePane";
import Doc from "./Doc";
import Header from "./Header";
import Pane from "./Pane";
import Repo from "./Repo";
import Utils from "./Utils";

const Log = RootLog.getLogger("dox.App");

RootLog.setLevel("debug");


interface Props {}

interface State {
  action: string;
  repo: Repo;
  doc: Doc;
}

class App extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const that = this;

    window.onhashchange = function () {
      Log.debug("window.onhashchange event");
      that.hashChange();
    };
    this.state = this.makeRepoDocState();
  }


  changeAction(action: string) {
    this.setState({
      action: action,
    });
  }


  hashChange() {
    this.setState(this.makeRepoDocState());
  }


  private makeRepoDocState(): State {
    const url_props = Utils.getFragmentPropsFromURL(window.location.href);
    const same_repo = this.state && this.state.repo &&
      this.state.repo.isSameRepo(url_props.repo_url, url_props.branch);
    const repo = same_repo ? this.state.repo :
      new Repo(url_props.repo_url, url_props.branch);
    const doc = repo.getDoc(url_props.path || "/");
    doc.getPromiseMarkdown()
      .then(function () {
        Log.debug(`setting window title: ${doc.getTitle()}`);
        window.document.title = doc.getTitle();
      });
    return {
      action: "view",
      doc: doc,
      repo: repo,
    } as State;
  }


  render() {
    var content;
    if (this.state.action === "view") {
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
        <Header doc={this.state.doc} changeAction={this.changeAction.bind(this)} />
        {content}
      </div>
    );
  }

  renderView() {
    var panes = [];
    var parent_doc = this.state.doc.getParentDoc();
    if (parent_doc) {
      panes.push(
        <AdjustablePane key="left">
          <Pane doc={parent_doc}
            highlight_link={this.state.doc}
          />
        </AdjustablePane>
      );
    }
    panes.push(
      <div id="main_pane" key="main">
        <Pane doc={this.state.doc} />
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

}

ReactDOM.render(<App />,
  window.document.getElementById("app_dynamic"));
