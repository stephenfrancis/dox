
import React from "react";
import PropTypes from "prop-types";
import Location from "./Location.js";


export default class Header extends React.Component {

  getBreadcrumbs() {
    const that = this;
    var breadcrumbs = [];
    var concat_path = "";
    var i;
    var j = 0;

    function addBreadcrumb(label, final_part, url) {
      const key = "bc_" + j;
      j += 1;
      if (final_part) {
        breadcrumbs.push(<li key={key} className="active">{label}</li>);
      } else {
        url = that.props.location.getFullHashFromRoot(url);
        breadcrumbs.push(<li key={key}>
          <a href={url}>{label}</a> <span className="divider">/</span></li>);
      }
    }

    if (this.props.location.path_array.length > 0) {
      addBreadcrumb(this.props.location.repo_name, false, "");
      for (i = 0; i < this.props.location.path_array.length; i += 1) {
        concat_path += this.props.location.path_array[i] + "/";
        addBreadcrumb(this.props.location.path_array[i],
          (i === this.props.location.path_array.length - 1), concat_path);
      }
    } else {
      addBreadcrumb(this.props.location.repo_name, true);
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
        <div className="navbar-search">
          <input type="text" id="search_box" placeholder="search" />
        </div>
        <div className="navbar-breadcrumbs">
          <ul id="curr_location">
            {breadcrumbs}
          </ul>
        </div>
        <div className="navbar-buttons">
          <div className="btn-group">
            <a id="caching" type="button" className="btn btn-mini active"
              title="get documents from local storage instead of the server">Caching</a>
            <a id="list_docs" type="button" className="btn btn-mini" href="#action=index"
              title="list the cached documents in this repo, and highlight broken links">Index</a>
          </div>
        </div>
      </nav>
    );
  }
}


Header.propTypes = {
  location: PropTypes.instanceOf(Location).isRequired,
};
