
import React from "react";
import PropTypes from "prop-types";
import Location from "./Location.js";

const Log = require("loglevel").getLogger("dox.Pane");
const Utils = require("./Utils.js");
const Marked = require("marked");
const IndexedDBAjaxStore = require("lapis/IndexedDBAjaxStore.js");


export default class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      content: "Loading...",
    };
    this.load(props);
  }


  load(props) {
    const that = this;
    props.store.getDoc(props.location.getRelativeURL())
      .then(function (doc_obj) {
        Log.debug("doc_obj got, setting Pane.state.ready = true");
        that.setState({
          ready: true,
          content: that.convertDocumentContent(doc_obj),
        });
      })
      .then(null, function (err) {
        Log.error("Pane.getDoc error: " + err);
        that.setState({
          ready: true,
          content: "Pane.getDoc error: " + JSON.stringify(err),
        });
      });
  }


  convertDocumentContent(markdown) {
    var html;
    markdown = this.convertRelativePaths(markdown);
    html = this.convertMarkdownToHTML(markdown);
    // html = this.applyViz(html);
    return html;
  }


  // only INLINE markdown links are converted as relative URLs
  convertRelativePaths(markdown) {
    const that = this;
    return markdown.replace(/\[(.*)\]\((.*)\)/g, function (match_all, match_1, match_2) {
      Log.debug("convertRelativePaths() match: " + match_1 + ", " + match_2);
      return "[" + match_1 + "](" + that.convertRelativePath(match_2) + ")";
    });
  }


  convertRelativePath(href) {
    var new_url;
    Log.debug("convertRelativePath(" + href + ") tests: "
      + Utils.isRelativePath(href) + ", "
      + Utils.appearsToBeAFile(href) + ", "
      + Utils.isMarkdownFile(href));

    if (Utils.isRelativePath(href)
        && (!Utils.appearsToBeAFile(href) || Utils.isMarkdownFile(href))) {
      new_url = this.props.location.getFullHash(href);
      Log.debug("convertRelativePath(" + href + "): " + new_url);
      return new_url;
    }
    return href;
  }


  convertMarkdownToHTML(markdown) {
    return Marked(markdown, { smartypants: true, });
  }


  componentWillReceiveProps(next_props) {
    if (this.props.location.path !== next_props.location.path) {
      this.setState({
        ready: false,
        content: "Loading...",
      });
      this.load(next_props);
    }
  }


  render() {
    var id = this.props.id + "_pane";
    var classes = "flex_item";
    if (this.props.id === "left") {
      classes += " flex_item_desktop";
    }
    Log.debug("Pane.render() " + this.props.id + ", " + this.props.location.path + ", " + this.state.ready);
    return (
      <div id={id} className={classes}>
        <p dangerouslySetInnerHTML={{
          __html: this.state.content,
        }}></p>
      </div>
    );
  }
}


Pane.propTypes = {
  id: PropTypes.string.isRequired,
  store: PropTypes.instanceOf(IndexedDBAjaxStore).isRequired,
  location: PropTypes.instanceOf(Location).isRequired,
};
