
import * as React from "react";
import RootLog from "loglevel";
import Doc from "./Doc";
import DocSearchResult from "./DocSearchResult";
import Repo from "./Repo";

const Log = RootLog.getLogger("dox.SearchMatch");

interface Props {
  search_term: string;
  repo: Repo;
}

interface State {
  found_matches: number;
}

export default class SearchMatch extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      found_matches: 0,
    } as State;
  }


  componentWillReceiveProps(next_props) {
    if (next_props.repo !== this.props.repo || next_props.search_term !== this.props.search_term) {
      this.setState({
        found_matches: 0,
      } as State);
    }
  }


  addFoundMatches(more_matches: number): void {
    if (more_matches === 0) {
      return;
    }
    this.setState({
      found_matches: (this.state.found_matches + more_matches),
    });
  }


  render() {
    return (
      <div style={{ padding: "20px", }}>
        <div className="gen_block">
          Search term: <b>{this.props.search_term}</b>
          , Matches: <b>{this.state.found_matches}</b>
        </div>
        <DocSearchResult
          doc={this.props.repo.getRootDoc()}
          search_term={this.props.search_term}
          addFoundMatches={this.addFoundMatches.bind(this)}
        />
      </div>
    );
  }

}
