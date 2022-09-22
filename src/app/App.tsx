import Debug from "debug";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "underscore";
import { AdjustablePane } from "./AdjustablePane";
import Doc from "./Doc";
import { DocInfo } from "./DocInfo";
import { SearchMatch } from "./SearchMatch";
import { Header } from "./Header";
import { Pane } from "./Pane";
import Repo from "./Repo";
import Utils from "./Utils";

import "../public/dox.css";

const debug = Debug("app/App");

interface Props {}

const App: React.FC<Props> = () => {
  const [doc, setDoc] = React.useState<Doc>(null);
  const [repo, setRepo] = React.useState<Repo>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>(null);
  const setStateFromHash = React.useRef<() => void>(null);

  setStateFromHash.current = () => {
    debug(`setStateFromHash`);
    const urlProps = Utils.getFragmentPropsFromURL(window.location.href);
    const sameRepo =
      repo && repo.isSameRepo(urlProps.repo_url, urlProps.branch);
    const newRepo = sameRepo
      ? repo
      : new Repo(urlProps.repo_url, urlProps.branch);
    debug(
      `sameRepo? ${sameRepo} ${repo && repo.getHash()}, ${urlProps.repo_url}, ${
        urlProps.branch
      }`
    );
    if (!sameRepo) {
      setRepo(newRepo);
    }
    setDoc(null);
    setSearchTerm(null);
    if (urlProps.search_term) {
      setSearchTerm(decodeURIComponent(urlProps.search_term));
    } else if (urlProps.path) {
      const doc = newRepo.getDoc(urlProps.path || "/");
      doc.getPromiseMarkdown().then(() => {
        debug(`setting window title: ${doc.getTitle()}`);
        window.document.title = doc.getTitle();
        window.scroll(0, 0);
      });
      setDoc(doc);
    }
  };

  React.useEffect(() => {
    window.onhashchange = function () {
      debug("window.onhashchange event");
      setStateFromHash.current();
    };
    setStateFromHash.current();
  }, []);

  const renderView = () => {
    var parentDoc = doc.getParentDoc();
    return (
      <div id="container" style={{ display: "flex", flexDirection: "row" }}>
        {parentDoc && (
          <AdjustablePane>
            <Pane doc={parentDoc} highlight_link={doc} />
          </AdjustablePane>
        )}
        <div id="main_pane">
          <Pane doc={doc} />
        </div>
      </div>
    );
  };

  const renderInfo = () => {
    debug("renderInfo()");
    return (
      <div
        style={{
          paddingTop: 50,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 20,
        }}
      >
        <h3>Site map</h3>
        <ul>
          <DocInfo doc={repo.getRootDoc()} />
        </ul>
      </div>
    );
  };

  return (
    <div>
      {!!repo && <Header repo={repo} doc={doc} />}
      {searchTerm && <SearchMatch repo={repo} search_term={searchTerm} />}
      {!searchTerm && doc && renderView()}
      {!searchTerm && !doc && repo && renderInfo()}
    </div>
  );
};

ReactDOM.render(<App />, window.document.getElementById("app_dynamic"));
