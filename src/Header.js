
import React from "react";


class Header extends React.Component {
  render() {
    return (
      <nav class="navbar">
        <div class="navbar-icon">
          <a href="#"><img src="favicon-32x32.png" /></a>
        </div>
        <div class="navbar-search">
          <input type="text" id="search_box" placeholder="search" />
        </div>
        <div class="navbar-breadcrumbs">
          <ul id="curr_location">
          </ul>
        </div>
        <div class="navbar-buttons">
          <div class="btn-group">
            <a id="caching" type="button" class="btn btn-mini active" title="get documents from local storage instead of the server">Caching</a>
            <a id="list_docs" type="button" class="btn btn-mini" href="#action=index" title="list the cached documents in this repo, and highlight broken links">Index</a>
          </div>
        </div>
      </nav>
    );
  }
}
