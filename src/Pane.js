
import React from "react";


class Pane extends React.Component {
  getInitialState() {
    const that = this;
    if (this.props.path_array) {
      this.props.store.getDoc(this.props.path_array.join("/"))
        .then(function (doc_obj) {
          that.setState({
            ready: true,
            content: doc_obj,
          });
        });
    }
    return {
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
    if (!this.props.path_array) {
      content = <p>No path_array for this pane</p>;
    } else if (!this.state.ready) {
      content = <p>Loading...</p>;
    } else {
      content = <p dangerouslySetInnerHTML={{__html: this.state.content, }}></p>
    }
    return (
        <div id={id} class={classes}>
        </div>
    );
  }
}
