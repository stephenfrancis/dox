
import React from "react";
import PropTypes from "prop-types";

const Log = require("loglevel").getLogger("dox.Pane");
const Utils = require("./Utils.js");
const Marked = require("marked");
const IndexedDBAjaxStore = require("lapis/IndexedDBAjaxStore.js");


export default class Pane extends React.Component {
  constructor(props) {
    super(props);
    const that = this;
    if (this.props.path_array) {
      this.props.store.getDoc(Utils.getFileFromPathArray(this.props.path_array))
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
    this.state = {
      ready: false,
      content: "Loading...",
    };
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
    var path_array; // protocol not specified, relative URL, to a directory or markdown file
    var new_url;
    Log.debug("convertRelativePath(" + href + ") tests: "
      + Utils.isRelativePath(href) + ", "
      + Utils.appearsToBeAFile(href) + ", "
      + Utils.isMarkdownFile(href));

    if (Utils.isRelativePath(href)
        && (!Utils.appearsToBeAFile(href) || Utils.isMarkdownFile(href))) {
      path_array = this.props.path_array.slice(0);
      path_array.splice(path_array.length, 0, Utils.getPathArray(href));
      Utils.normalizePathArray(path_array);
      new_url = "#action=view";
      if (this.props.remote) {
        new_url += "&remote=" + this.props.remote;
      }
      new_url += "&path=" + path_array.join("/")
      Log.debug("convertRelativePath(" + href + "): " + new_url);
      return new_url;
    }
    return href;
  }


  convertMarkdownToHTML(markdown) {
    return Marked(markdown, { smartypants: true, });
  }


  render() {
    var id = this.props.id + "_pane";
    var classes = "flex_item";
    if (this.props.id === "left") {
      classes += " flex_item_desktop";
    }
    Log.debug("Pane.render() " + this.props.id + ", " + this.props.path_array + ", " + this.state.ready);
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
  path_array: PropTypes.array.isRequired,
  store: PropTypes.instanceOf(IndexedDBAjaxStore).isRequired,
  remote: PropTypes.string,
};
