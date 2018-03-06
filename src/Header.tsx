
import * as React from "react";
import * as RootLog from "loglevel";
import Doc from "./Doc";

interface Props {
  doc: Doc;
  changeAction: Function;
}

interface State {}

export default class Header extends React.Component<Props, State> {

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
          <a id="info" type="button" onClick={this.props.changeAction.bind(this, "info")} style={{
            color: "#000",
          }}
          title="view information about this repo, and highlight broken links">🛈</a>
        </div>
        <div className="navbar-search">
          <input type="text" id="search_box" placeholder="search" />
        </div>
      </nav>
    );
  }
}
