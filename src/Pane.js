
import React from "react";
import PropTypes from "prop-types";
import Location from "./Location.js";

const Log = require("loglevel").getLogger("dox.Pane");
const Utils = require("./Utils.js");
const Viz = require("viz.js");
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
    markdown = this.separateOutDigraphBlocks(markdown);
    html = this.convertMarkdownToHTML(markdown);
    html = this.applyViz(html);
    return html;
  }


  // only INLINE markdown links are converted as relative URLs
  convertRelativePaths(markdown) {
    const that = this;
    return markdown.replace(/\[(.*)\]\((.*)\)/g, function (match_all, match_1, match_2) {
      var out = "[" + match_1 + "](" + that.convertRelativePath(match_2) + ")";
      Log.debug("convertRelativePaths() match: " + match_1 + ", " + match_2);
      if (that.highlight_link) {
        Log.debug("highlight_link path: " + that.highlight_link.path);
      }
      if (that.highlight_link && that.highlight_link.path === match_2) {
        out = "**" + out + "**";
      }
      return out;
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


  separateOutDigraphBlocks(markdown) {
    const lines = markdown.split("\n");
    var out = "";
    var block_number = 0;

    this.digraph_block = [];
    console.log("separateOutDigraphBlocks() lines: " + lines.length);
    for (let i = 0; i < lines.length; i += 1) {
      // console.log("separateOutDigraphBlocks: " + lines[i]);
      if (!this.digraph_block[block_number]) {
        if (lines[i].indexOf("digraph") === 0) {
          this.digraph_block[block_number] = lines[i];
        } else {
          out += "\n" + lines[i];
        }
      } else {
        this.digraph_block[block_number] += "\n" + lines[i];
        if (lines[i].indexOf("}") > -1) {
          out += "\n¬¬DIGRAPH<" + block_number + ">¬¬"
          block_number += 1;
        }
      }
    }
    console.log("separateOutDigraphBlocks() out: " + lines.length
      + ", blocks: " + block_number + ", out: " + out);
    return out;
  }


  applyViz(html) {
    const that = this;
    console.log("applyViz() : " + that.digraph_block.length);
    return html.replace(/¬¬DIGRAPH<(\d+)>¬¬/, function (match, match_1) {
      const block_number = parseInt(match_1);
      console.log("block_number: " + block_number);
      try {
        if (!that.digraph_block[block_number]) {
          throw new Error("no digraph block found for " + block_number);
        }
        return Viz(that.digraph_block[block_number], "svg");
      } catch (e) {
        return "<p><b>Error in Viz: " + e.toString() + "</b></p>";
      }
    });
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
  highlight_link: PropTypes.instanceOf(Location),
};
