// import Debug from "debug";
import * as Path from "path-browserify";

// const debug = Debug("app/Utils");

export default class Utils {
  static appearsToBeAFile(path: string): boolean {
    return !!Path.extname(path); // has an extension
  }

  static getFragmentPropsFromURL(href: string): any {
    const url = new URL(href);
    const props = this.getFragmentPropsFromHash(url.hash || "");
    if (!props.repo_url) {
      props.repo_url =
        url.protocol +
        "//" +
        url.host +
        url.pathname.substring(0, url.pathname.lastIndexOf("/"));
    }
    return props;
  }

  static getFragmentPropsFromHash(hash: string): any {
    const out = {};
    if (hash) {
      hash = hash.substring(1);
    } else {
      hash = "";
    }
    hash.split("&").forEach(function (pair) {
      var parts = pair.split("=");
      if (parts.length > 1) {
        out[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
    return out;
  }

  static isMarkdownFile(path: string): boolean {
    return Path.extname(path) === ".md";
  }

  static isProtocolRelativeURL(url: string): boolean {
    const protocols = ["ftp:", "http:", "https:", "mailto:"];
    return !protocols.reduce(function (prev_val: boolean, curr_val: string) {
      return prev_val || url.indexOf(curr_val) === 0;
    }, false);
  }
}
