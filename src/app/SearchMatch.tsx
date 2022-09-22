import * as React from "react";
import { DocSearchResult } from "./DocSearchResult";
import Repo from "./Repo";

interface Props {
  search_term: string;
  repo: Repo;
}

export const SearchMatch: React.FC<Props> = (props) => {
  const [foundMatches, setFoundMatches] = React.useState(0);
  React.useEffect(() => {
    setFoundMatches(0);
  }, [props.repo, props.search_term]);

  const addFoundMatches = (more_matches: number): void => {
    if (more_matches === 0) {
      return;
    }
    setFoundMatches(foundMatches + more_matches);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="gen_block">
        Search term: <b>{props.search_term}</b>, Matches: <b>{foundMatches}</b>
      </div>
      <DocSearchResult
        doc={props.repo.getRootDoc()}
        search_term={props.search_term}
        addFoundMatches={addFoundMatches}
      />
    </div>
  );
};
