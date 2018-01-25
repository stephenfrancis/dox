
import React from "react";

const Log = require("loglevel").getLogger("dox.Pane");


export default class Pane extends React.Component {
  constructor(props) {
    super(props);
    const that = this;
    if (this.props.path) {
      this.props.store.getDoc(this.props.path)
        .then(function (doc_obj) {
          that.setState({
            ready: true,
            content: doc_obj,
          });
        });
    }
    this.state = {
      ready: false,
    };
  }


  render() {
    var id = this.props.id + "_pane";
    var classes = "flex_item";
    var content;
    if (this.props.id === "left") {
        classes += " flex_item_desktop";
    }
    if (!this.props.path) {
      content = (
        <p>No path for this pane</p>
      );
    } else if (!this.state.ready) {
      content = (
        <p>Loading...</p>
      );
    } else {
      content = (
        <p dangerouslySetInnerHTML={{__html: this.state.content, }}></p>
      );
    }
    console.log("render() " + this.props.path + ", " + this.state.ready);
    return (
        <div id={id} className={classes}>
          {content}
        </div>
    );
  }
}
