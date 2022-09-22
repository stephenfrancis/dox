// import Debug from "debug";
import * as React from "react";
import Doc from "./Doc";
import Repo from "./Repo";

// const debug = Debug("app/Header");

interface Props {
  doc?: Doc;
  repo: Repo;
}

export const Header: React.FC<Props> = (props) => {
  const searchInput = React.useRef<HTMLInputElement>();

  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    var j = 0;
    var doc = props.doc;

    if (doc) {
      breadcrumbs.unshift(
        <li key={"bc_" + j} className="active">
          {doc.getName()}
        </li>
      );
      while ((doc = doc.getParentDoc())) {
        j += 1;
        breadcrumbs.unshift(
          <li key={"bc_" + j}>
            <a href={doc.getHash()}>{doc.getName()}</a>
            <span className="divider">/</span>
          </li>
        );
      }
    }
    breadcrumbs.unshift(
      <li key="bc_repo">
        <a href={props.repo.getRootDoc().getHash()}>
          {props.repo.getRootDoc().getTitle() || props.repo.getRepoName()}
        </a>
      </li>
    );
    return breadcrumbs;
  };

  const triggerSearch = () => {
    const search_term = searchInput.current.value;
    searchInput.current.value = "";
    if (!search_term) {
      return; // ignore empty search altogether
    }
    // alert(`search for: '${search_term}'`);
    window.location.href =
      props.repo.getHash() + "&search_term=" + encodeURIComponent(search_term);
  };

  const handleSearchKeyUp = (event) => {
    if (event.keyCode === 13) {
      triggerSearch();
    }
  };

  const breadcrumbs = getBreadcrumbs();
  return (
    <nav className="navbar">
      <div className="navbar-breadcrumbs">
        <ul id="curr_location">{breadcrumbs}</ul>
      </div>
      <div className="navbar-search">
        <input
          type="text"
          id="search_box"
          placeholder="search"
          ref={searchInput}
          onBlur={triggerSearch}
          onKeyUp={handleSearchKeyUp}
        />
      </div>
      <div className="navbar-info">
        <a
          id="info"
          type="button"
          href={props.repo.getHash()}
          title="view information about this repo, and highlight broken links"
        >
          ⓘ
        </a>
      </div>
    </nav>
  );
};
