
import * as React from "react";
import * as RootLog from "loglevel";
import * as _ from "underscore";
import * as Path from "path";
import * as Viz from "viz.js";
import * as Marked from "marked";
import * as IndexedDBAjaxStore from "lapis/IndexedDBAjaxStore";
import Location from "./Location";


const Log = RootLog.getLogger("dox.Pane");


interface Props {
  store: IndexedDBAjaxStore;
  location: Location;
  highlight_link?: Location;
}

interface State {
  ready: boolean;
  content: string;
}

export default class Pane extends React.Component<Props, State> {
  private digraph_block: string[];

  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      content: "Loading...",
    } as State;
    this.load(props);
  }


  load(props) {
    const that = this;
    const file_url = props.location.getSourceFileURL();
    Log.debug("Pane.load() getting: " + file_url);
    props.store.getDoc(file_url)
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


  convertDocumentContent(markdown: string): string {
    var html;
    markdown = this.convertRelativePaths(markdown);
    markdown = this.separateOutDigraphBlocks(markdown);
    html = this.convertMarkdownToHTML(markdown);
    html = this.applyViz(html);
    return html;
  }


  // only INLINE markdown links are converted as relative URLs
  convertRelativePaths(markdown: string): string {
    const that = this;
    return markdown.replace(/\[(.*)\]\((.*?)\)/g, function (match_all, match_1, match_2) {
      Log.debug("convertRelativePaths() match: " + match_1 + ", " + match_2);
      if (that.isURLNeedingConversion(match_2)) {
        return that.convertURL(match_2, match_1);
      }
      return "[" + match_1 + "](" + match_2 + ")";
    });
  }


  isURLNeedingConversion(href: string): boolean {
    Log.debug("convertRelativePath(" + href + ") tests: "
      + Path.isAbsolute(href) + ", "
      + this.props.location.appearsToBeAFile(href) + ", "
      + this.props.location.isMarkdownFile(href));

    return (!Path.isAbsolute(href)
        && (!this.props.location.appearsToBeAFile(href)
          || this.props.location.isMarkdownFile(href)));
  }


  convertURL(href: string, label: string): string {
    var full_path = this.props.location.getFullPathFromRelative(href);
    var out = "[" + label + "](" + this.props.location.getHash(full_path) + ")";

    Log.debug("convertURL(" + href + "): " + full_path);
    if (this.props.highlight_link) {
      Log.debug("highlight_link path: " + this.props.highlight_link.getPath());
    }
    if (this.props.highlight_link && this.props.highlight_link.getPath() === full_path) {
      out = "**" + out + "**";
    }
    return out;
  }


  convertMarkdownToHTML(markdown: string): string {
    return Marked(markdown, { smartypants: true, });
  }


  separateOutDigraphBlocks(markdown: string): string {
    const lines = markdown.split("\n");
    var out = "";
    var block_number = 0;

    this.digraph_block = [];
    Log.trace("separateOutDigraphBlocks() lines: " + lines.length);
    for (let i = 0; i < lines.length; i += 1) {
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
    Log.trace("separateOutDigraphBlocks() out: " + lines.length
      + ", blocks: " + block_number + ", out: " + out);
    return out;
  }


  applyViz(html: string): string {
    const that = this;
    Log.trace("applyViz() : " + that.digraph_block.length);
    return html.replace(/¬¬DIGRAPH<(\d+)>¬¬/, function (match, match_1) {
      const block_number = parseInt(match_1);
      Log.trace("block_number: " + block_number);
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
    function isLocationChanged(old_locn, new_locn) {
      return (old_locn && new_locn && old_locn.path !== new_locn.path);
    }
    if (isLocationChanged(this.props.location, next_props.location)
      || isLocationChanged(this.props.highlight_link, next_props.highlight_link)) {
      // doing this here causes a flicker in the pane...
      // this.setState({
      //   ready: false,
      //   content: "Loading...",
      // });
      this.load(next_props);
    }
  }


  render() {
    Log.debug("Pane.render() " + this.props.location.getPath() + ", " + this.state.ready);
    return (
      <div>
        <p dangerouslySetInnerHTML={{
          __html: this.state.content,
        }}></p>
      </div>
    );
  }

}
