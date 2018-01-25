
import React from "react";


export default class Header extends React.Component {
  render() {
    return (
      <nav className="navbar">
        <div className="navbar-icon">
          <a href="#"><img src="favicon-32x32.png" /></a>
        </div>
        <div className="navbar-search">
          <input type="text" id="search_box" placeholder="search" />
        </div>
        <div className="navbar-breadcrumbs">
          <ul id="curr_location">
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
