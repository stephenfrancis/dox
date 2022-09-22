import Debug from "debug";
import * as React from "react";
import Doc from "./Doc";

const debug = Debug("app/DocSearchResult");

enum LoadState {
  Failed,
  Loading,
  Ready,
}

interface Props {
  doc: Doc;
  search_term: string;
  addFoundMatches?(more_matches: number): void;
}

interface State {
  load_state: LoadState;
}

export const DocSearchResult: React.FC<Props> = (props) => {
  let load_err: string = "no error";

  const [loadState, setLoadState] = React.useState<LoadState>(
    LoadState.Loading
  );
  const [matches, setMatches] = React.useState<string[]>([]);

  const getMatches = (content) => {
    const lines = content.split(/\r\n|\n/);
    const regex1 = new RegExp("(.*)(" + props.search_term + ")(.*)", "i"); // danger? for the mo, treat query as a regex expr...;
    // const regex2 = new RegExp(this.props.search_term, "gi");
    const out = [];
    let match_count = 0;
    let j = 0;

    lines.forEach(function (line) {
      j += 1;
      const match = regex1.exec(line);
      if (match) {
        match_count += 1;
        out.push(
          <li key={"line" + j}>
            Line {j}: {match[1]}
            <span className="highlight">{match[2]}</span>
            {match[3]}
          </li>
        );
      }
    });
    if (props.addFoundMatches) {
      props.addFoundMatches(match_count);
    }
    return out;
  };

  const load = () => {
    props.doc
      .getPromiseMarkdown()
      .then((content) => {
        debug("SearchMatch promise returned");
        setMatches(getMatches(content));
        setLoadState(LoadState.Ready);
      })
      .catch((err) => {
        load_err = String(err);
        setLoadState(LoadState.Failed);
      });
  };

  React.useEffect(() => {
    load();
  }, [props.doc, props.search_term]);

  const onClick = () => {
    window.location.href = props.doc.getHash();
  };

  const renderChildren = () => {
    const children = [];
    props.doc.getChildDocs().forEach(function (doc) {
      children.push(
        <DocSearchResult
          doc={doc}
          key={doc.getName()}
          search_term={props.search_term}
          addFoundMatches={props.addFoundMatches}
        />
      );
    });
    return <div>{children}</div>;
  };

  const renderFailed = () => {
    return (
      <div className="gen_block error">
        failed to load : {props.doc.getName()}, error: {load_err}
      </div>
    );
  };

  const renderResultBlock = () => {
    return (
      <div className="match_result" onClick={onClick}>
        <div>
          <b>{props.doc.getTitle()}</b>
        </div>
        <ul>{matches}</ul>
      </div>
    );
  };

  const renderUnready = () => {
    return <div className="gen_block">loading: {props.doc.getName()}</div>;
  };

  const renderReady = () => {
    return (
      <div>
        {matches.length > 0 && renderResultBlock()}
        {props.doc.hasChildren() && renderChildren()}
      </div>
    );
  };

  switch (loadState) {
    case LoadState.Loading:
      return renderUnready();
    case LoadState.Ready:
      return renderReady();
    default:
      return renderFailed();
  }
};
