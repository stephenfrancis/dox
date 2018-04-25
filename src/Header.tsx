
import * as React from "react";
import RootLog from "loglevel";
import Doc from "./Doc";
import Repo from "./Repo";

const Log = RootLog.getLogger("dox.Header");


interface Props {
  doc?: Doc;
  repo: Repo;
}

interface State {}

export default class Header extends React.Component<Props, State> {
  private search_input: any;

  getBreadcrumbs() {
    const that = this;
    const breadcrumbs = [];
    var j = 0;
    var doc = this.props.doc;

    if (doc) {
      breadcrumbs.unshift(<li key={"bc_" + j} className="active">{doc.getName()}</li>);
      while (doc = doc.getParentDoc()) {
        j += 1;
        breadcrumbs.unshift(<li key={"bc_" + j}>
          <a href={doc.getHash()}>{doc.getName()}</a>
          <span className="divider">/</span></li>);
      }
    }
    breadcrumbs.unshift(<li key="bc_repo">
      <a href={this.props.repo.getRootDoc().getHash()}>{this.props.repo.getRepoName()}</a></li>);
    return breadcrumbs;
  }


  setupSearchInput(input): void {
    this.search_input = input;
  }


  triggerSearch() {
    const search_term = this.search_input.value;
    this.search_input.value = "";
    if (!search_term) {
      return; // ignore empty search altogether
    }
    // alert(`search for: '${search_term}'`);
    window.location.href = this.props.repo.getHash()
      + "&search_term=" + encodeURIComponent(search_term);
  }


  handleSearchKeyUp(event) {
    if (event.keyCode === 13) {
      this.triggerSearch();
    }
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
          <a id="info" type="button" href={this.props.repo.getHash()}
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
            onBlur={this.triggerSearch.bind(this)}
            onKeyUp={this.handleSearchKeyUp.bind(this)} />
        </div>
      </nav>
    );
  }
}
