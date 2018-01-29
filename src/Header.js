
import React from "react";
import PropTypes from "prop-types";


export default class Header extends React.Component {

  getBreadcrumbs() {
    var breadcrumbs = [];
    var concat_path = "";
    var i;
    var j = 0;

    function addBreadcrumb(url, label, final_part) {
      const key = "bc_" + j;
      j += 1;
      if (final_part) {
        breadcrumbs.push(<li key={key} className="active">{label}</li>);
      } else {
        breadcrumbs.push(<li key={key}><a href={url}>{label}</a> <span className="divider">/</span></li>);
      }
    }

    if (this.props.path_array.length > 0) {
      addBreadcrumb("#action=view", this.props.current_repo, false);
      for (i = 0; i < this.props.path_array.length; i += 1) {
        concat_path += this.props.path_array[i] + "/";
        addBreadcrumb("#action=view&path=" + concat_path, this.props.path_array[i],
          (i === this.props.path_array.length - 1));
      }
    } else {
      addBreadcrumb("#action=view", this.props.current_repo, true);
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
  current_repo: PropTypes.string.isRequired,
  path_array: PropTypes.array,
};
