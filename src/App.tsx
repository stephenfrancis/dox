
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RootLog from "loglevel";
import * as _ from "underscore";
import AdjustablePane from "./AdjustablePane";
import Doc from "./Doc";
import DocInfo from "./DocInfo";
import SearchMatch from "./SearchMatch";
import Header from "./Header";
import Pane from "./Pane";
import Repo from "./Repo";
import Utils from "./Utils";

/* globals window */

RootLog.setLevel("debug");
const Log = RootLog.getLogger("dox.App");


interface Props {}

interface State {
  doc: Doc;
  repo: Repo;
  search_term?: string;
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


  private hashChange() {
    this.setState(this.makeRepoDocState());
  }


  private makeRepoDocState(): State {
    const url_props = Utils.getFragmentPropsFromURL(window.location.href);
    const same_repo = this.state && this.state.repo &&
      this.state.repo.isSameRepo(url_props.repo_url, url_props.branch);
    const state = {
      doc: null,
      search_term: null,
      repo: same_repo ? this.state.repo :
        new Repo(url_props.repo_url, url_props.branch),
    } as State;

    if (url_props.search_term) {
      state.search_term = decodeURIComponent(url_props.search_term);
    } else if (url_props.path) {
      state.doc = state.repo.getDoc(url_props.path || "/");
      state.doc.getPromiseMarkdown()
        .then(function () {
          Log.debug(`setting window title: ${state.doc.getTitle()}`);
          window.document.title = state.doc.getTitle();
          window.scroll(0, 0);
        });
    }
    return state;
  }


  render() {
    var content;
    if (this.state.search_term) {
      content = this.renderSearch();
    } else if (this.state.doc) {
      content = this.renderView();
    } else {
      content = this.renderInfo();
    }
    return (
      <div>
        <Header repo={this.state.repo} doc={this.state.doc} />
        {content}
      </div>
    );
  }

  private renderView() {
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


  private renderSearch() {
    return (
      <SearchMatch
        repo={this.state.repo}
        search_term={this.state.search_term} />
    );
  }


  private renderInfo() {
    Log.debug("renderInfo()");
    return (
      <div style={{ padding: "20px", }}>
        <div className="gen_block">Repo: <b>{this.state.repo.getRepoName()}</b></div>
        <ul>
          <DocInfo doc={this.state.repo.getRootDoc()} />
        </ul>
      </div>
    );
  }

}

ReactDOM.render(<App />,
  window.document.getElementById("app_dynamic"));
