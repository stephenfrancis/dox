
import * as React from "react";
import * as RootLog from "loglevel";
import * as Path from "path";
import * as IndexedDBAjaxStore from "lapis/IndexedDBAjaxStore";
import Doc from "./Doc";


const Log = RootLog.getLogger("dox.Pane");


interface Props {
  doc: Doc;
  highlight_link?: Doc;
}

interface State {
  ready: boolean;
  content: string;
}

export default class Pane extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      content: "Loading...",
    } as State;
    this.load(props);
  }


  private load(props: Props) {
    const that = this;
    const highlight_link_path = props.highlight_link && props.highlight_link.getPath();
    props.doc.getPromiseHTML(highlight_link_path)
      .then(function (content) {
        that.setState({
          ready: true,
          content: content,
        } as State);
      });
  }


  componentWillReceiveProps(next_props) {
    this.load(next_props);
  }


  render() {
    const style: any = {};
    Log.debug("Pane.render() " + this.props.doc.getPath() + ", " + this.state.ready);
    if (!this.state.ready) {
      style.opacity = 0.5;
    }
    return (
      <div style={{style}}>
        <p dangerouslySetInnerHTML={{
          __html: this.state.content,
        }}></p>
      </div>
    );
  }

}
