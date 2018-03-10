
import * as React from "react";
import * as RootLog from "loglevel";
import Doc from "./Doc";

const Log = RootLog.getLogger("dox.Header");


interface Props {
  doc: Doc;
  changeAction(action: string, search_term?: string): void;
}

interface State {}

export default class Header extends React.Component<Props, State> {
  private search_input: any;

  getBreadcrumbs() {
    const that = this;
    const breadcrumbs = [];
    var j = 0;
    var doc = this.props.doc;

    breadcrumbs.unshift(<li key={"bc_" + j} className="active">{doc.getName()}</li>);
    while (doc = doc.getParentDoc()) {
      j += 1;
      breadcrumbs.unshift(<li key={"bc_" + j}>
        <a href={doc.getHash()}>{doc.getName()}</a>
        <span className="divider">/</span></li>);
    }
    doc = this.props.doc.getRepo().getDoc("/");
    breadcrumbs.unshift(<li key="bc_repo">
      <a href={doc.getHash()}>{doc.getRepo().getRepoName()}</a></li>);
    return breadcrumbs;
  }


  changeAction(action: string) {
    this.props.changeAction(action);
  }


  setupSearchInput(input): void {
    this.search_input = input;
  }


  triggerSearch() {
    const search_term = this.search_input.value;
    this.search_input.value = "";
    // alert(`search for: '${search_term}'`);
    this.props.changeAction("search", search_term);
  }


  render() {
    var breadcrumbs = this.getBreadcrumbs();
    return (
      <nav className="navbar">
        <div className="navbar-icon">
          <a href="#"><img src="icon.png" /></a>
        </div>
        <div className="navbar-breadcrumbs">
          <ul id="curr_location">
            {breadcrumbs}
          </ul>
        </div>
        <div style={{
          fontSize: "32px",
          right: 0,
          padding: "14px 10px",
          backgroundColor: "#f5f5f5",
        }}>
          <a id="info" type="button" onClick={this.changeAction.bind(this, "info")}
            title="view information about this repo, and highlight broken links"
            style={{
              color: "#000",
              cursor: "pointer",
              textDecoration: "none",
            }}>🛈</a>
        </div>
        <div className="navbar-search">
          <input type="text" id="search_box" placeholder="search"
            ref={this.setupSearchInput.bind(this)}
            onBlur={this.triggerSearch.bind(this)} />
        </div>
      </nav>
    );
  }
}
