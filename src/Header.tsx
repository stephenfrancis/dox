
import * as React from "react";
import * as RootLog from "loglevel";
import Location from "./Location";

interface Props {
  location: Location;
  changeAction: Function;
}

interface State {}

export default class Header extends React.Component<Props, State> {

  getBreadcrumbs() {
    const that = this;
    const split_path = this.props.location.splitPath();
    var breadcrumbs = [];
    var concat_path = "";
    var i;
    var j = 0;

    function addBreadcrumb(label, final_part) {
      const key = "bc_" + j;
      j += 1;
      if (final_part) {
        breadcrumbs.push(<li key={key} className="active">{label}</li>);
      } else {
        breadcrumbs.push(<li key={key}>
          <a href={that.props.location.getHash(concat_path)}>{label}</a>
          <span className="divider">/</span></li>);
      }
    }

    if (split_path.length > 0) {
      addBreadcrumb(this.props.location.getRepoName(), false);
      for (i = 0; i < split_path.length; i += 1) {
        concat_path += "/" + split_path[i];
        addBreadcrumb(split_path[i], (i === split_path.length - 1));
      }
    } else {
      addBreadcrumb(this.props.location.getRepoName(), true);
    }

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
