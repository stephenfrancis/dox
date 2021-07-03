
import * as React from "react";
import * as RootLog from "loglevel";
import Doc from "./Doc";

const Log = RootLog.getLogger("dox.DocInfo");

enum LoadState {
  Loading,
  Ready,
  Failed,
}

interface Props {
  doc: Doc;
}

interface State {
  load_state: LoadState;
}

export default class DocInfo extends React.Component<Props, State> {
  private load_err: string;

  constructor(props) {
    super(props);
    this.load_err = "no error";
    this.state = {
      load_state: LoadState.Loading,
    } as State;
    const that = this;
    this.props.doc.getPromiseMarkdown()
      .then(function () {
        Log.debug("DocInfo promise returned");
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
    this.props.doc.getChildDocs().forEach(function (doc) {
      children.push(<DocInfo doc={doc} key={doc.getName()} />);
    });
    return (<ul>{children}</ul>);
  }


  renderFailed() {
    return (<li className="error">failed to load: {this.props.doc.getName()}, error: {this.load_err}</li>);
  }

  renderReady() {
    return (
      <li><a href={this.props.doc.getHash()}>{this.props.doc.getTitle()}</a>
        <span className="lowkey"> {this.props.doc.getName()}</span>
        {this.props.doc.hasChildren() && this.renderChildren()}
      </li>
    );
  }


  renderUnready() {
    return (<li>loading: {this.props.doc.getName()}</li>);
  }

}
