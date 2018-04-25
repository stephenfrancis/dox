
import * as React from "react";
import RootLog from "loglevel";
import Doc from "./Doc";

const Log = RootLog.getLogger("dox.DocSearchResult");

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

export default class DocSearchResult extends React.Component<Props, State> {
  private load_err: string;
  private matches: Array<string>;

  constructor(props) {
    super(props);
    this.load_err = "no error";
    this.state = {
      load_state: LoadState.Loading,
    } as State;
    this.load(props);
  }


  componentWillReceiveProps(next_props) {
    if (next_props.doc !== this.props.doc || next_props.search_term !== this.props.search_term) {
      this.load(next_props);
    }
  }


  getMatches(content) {
    const lines = content.split(/\r\n|\n/);
    const regex1 = new RegExp("(.*)(" + this.props.search_term + ")(.*)", "i"); // danger? for the mo, treat query as a regex expr...;
    // const regex2 = new RegExp(this.props.search_term, "gi");
    const out = [];
    const that = this;
    let match_count = 0;
    let j = 0;

    lines.forEach(function (line) {
      j += 1;
      const match = regex1.exec(line);
      if (match) {
        match_count += 1;
        out.push(
          <li key={"line" + j}>Line {j}: {match[1]}
            <span className="highlight">{match[2]}</span>{match[3]}
          </li>
        );
      }
    });
    if (this.props.addFoundMatches) {
      this.props.addFoundMatches(match_count);
    }
    return out;
  }


  load(props) {
    const that = this;
    props.doc.getPromiseMarkdown()
      .then(function (content) {
        Log.debug("SearchMatch promise returned");
        that.matches = that.getMatches(content);
        that.setState({
          load_state: LoadState.Ready,
        } as State);
      })
      .then(null, function (err) {
        that.load_err = String(err);
        that.setState({
          load_state: LoadState.Failed,
        } as State);
      });
  }


  onClick() {
    window.location.href = this.props.doc.getHash();
  }

  render() {
    switch (this.state.load_state) {
      case LoadState.Loading:
        return this.renderUnready();
      case LoadState.Ready:
        return this.renderReady();
      default:
        return this.renderFailed();
    }
  }


  renderChildren() {
    const children = [];
    const that = this;
    this.props.doc.getChildDocs().forEach(function (doc) {
      children.push(
        <DocSearchResult
          doc={doc}
          key={doc.getName()}
          search_term={that.props.search_term}
          addFoundMatches={that.props.addFoundMatches}
        />);
    });
    return (<div>{children}</div>);
  }


  renderFailed() {
    return (<div className="gen_block error">failed to load
      : {this.props.doc.getName()}, error: {this.load_err}</div>);
  }


  renderReady() {
    return (
      <div>
        {(this.matches.length > 0) && this.renderResultBlock()}
        {this.props.doc.hasChildren() && this.renderChildren()}
      </div>
    );
  }


  renderResultBlock() {
    return (
      <div className="match_result" onClick={this.onClick.bind(this)}>
        <div><b>{this.props.doc.getTitle()}</b></div>
        <ul>
          {this.matches}
        </ul>
      </div>
    );
  }


  renderUnready() {
    return (<div className="gen_block">loading: {this.props.doc.getName()}</div>);
  }

}
