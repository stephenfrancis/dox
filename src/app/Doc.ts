import Debug from "debug";
import { marked } from "marked";
import * as Path from "path-browserify";
// import Viz from "viz.js";
import Repo from "./Repo";
import Utils from "./Utils";

const debug = Debug("app/Doc");

export default class Doc {
  private child_docs: any;
  private doc_title: string;
  private is_directory: boolean;
  private loaded: boolean;
  private parent_doc?: Doc;
  private path: string;
  private promise: Promise<string>;
  private repo: Repo;

  constructor(repo: Repo, path: string, parent_doc: Doc) {
    this.child_docs = {};
    this.loaded = false;
    this.parent_doc = parent_doc;
    this.repo = repo;
    if (Path.basename(path) === "README.md") {
      path = Path.resolve(path, "..");
    }
    path = Path.normalize(path);
    const extname = Path.extname(path);
    if (path.charAt(0) !== "/") {
      throw new Error(`path must begin with '/': ${path}`);
    }
    if (extname !== ".md" && extname !== "") {
      throw new Error(
        `Doc seems neither a directory nor a markdown file: ${path}`
      );
    }
    this.path = path;
    this.doc_title = Path.basename(path);
    this.is_directory = extname === "";
    this.repo.docReffed();
  }

  public createChildDoc(dirname: string) {
    if (this.child_docs[dirname]) {
      throw new Error(`child doc ${dirname} already exists`);
    }
    this.child_docs[dirname] = new Doc(
      this.repo,
      this.path + "/" + dirname,
      this
    );
    return this.child_docs[dirname];
  }

  public getChildDoc(dirname: string) {
    debug(`Doc.getChildDoc(${dirname})`);
    return this.child_docs[dirname];
  }

  public getChildDocs(): Array<Doc> {
    this.throwIfNotLoaded();
    return Object.keys(this.child_docs).map((name) => this.child_docs[name]);
  }

  public getChildNames(): Array<string> {
    this.throwIfNotLoaded();
    return Object.keys(this.child_docs);
  }

  public getFullPathFromRelative(path: string): string {
    if (!this.is_directory) {
      path = "../" + path;
    }
    return Path.resolve(this.path, path);
  }

  public getHash(path?: string): string {
    return this.repo.getHash() + "&path=" + (path || this.path);
  }

  public getName(): string {
    return Path.basename(this.path);
  }

  public getOrCreateChildDoc(dirname: string): Doc {
    return this.getChildDoc(dirname) || this.createChildDoc(dirname);
  }

  public getParentDoc(): Doc {
    return this.parent_doc;
  }

  public getPath(): string {
    return this.path;
  }

  public getPromiseHTML(highlight_link_path?: string): Promise<string> {
    return this.getPromiseMarkdown().then((doc_obj: string) =>
      this.convertDocumentContent(doc_obj, highlight_link_path)
    );
  }

  public getPromiseMarkdown(): Promise<string> {
    if (!this.promise) {
      this.load();
    }
    return this.promise;
  }

  public getRepo(): Repo {
    return this.repo;
  }

  public getSourceFileURL(): string {
    var out = this.path;
    if (this.is_directory) {
      out += "/README.md";
    }
    return Path.normalize(out);
  }

  public getTitle(): string {
    return this.doc_title;
  }

  public hasChildren(): boolean {
    this.throwIfNotLoaded();
    return Object.keys(this.child_docs).length > 0;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  private load() {
    const file_url = this.getSourceFileURL();
    debug("Doc.load() getting: " + file_url);
    this.promise = this.repo
      .getPromise()
      .then((store) => store.getDoc(file_url))
      .then((doc: { id: string; content: string }): string => {
        var match = doc.content.match(/^\n*#\s*(.*)[\r\n]/);
        if (match) {
          debug(`setting doc_title to: ${match[1]}`);
          this.doc_title = match[1];
        }
        this.getDocLinks(doc.content);
        this.repo.docLoaded();
        this.loaded = true;
        return doc.content;
      }) as Promise<string>;
  }

  private convertDocumentContent(
    markdown: string,
    highlight_link_path?: string
  ): string {
    var html;
    const digraph_blocks = [];
    markdown = this.convertRelativePaths(markdown, highlight_link_path);
    markdown = this.separateOutDigraphBlocks(markdown, digraph_blocks);
    this.convertRelativePathsInDigraphBlocks(
      digraph_blocks,
      highlight_link_path
    );
    html = this.convertMarkdownToHTML(markdown);
    // html = this.applyViz(html, digraph_blocks);
    return html;
  }

  // only INLINE markdown links are converted as relative URLs
  private convertRelativePaths(
    markdown: string,
    highlight_link_path?: string
  ): string {
    return markdown.replace(
      /\[(.*)\]\((.*?)\)/g,
      (match_all, match_1, match_2) => {
        debug("convertRelativePaths() match: " + match_1 + ", " + match_2);
        if (this.isURLDirectoryOrMarkdown(match_2)) {
          return this.convertURL(match_2, match_1, highlight_link_path);
        } else if (this.isURLNeedingConversion(match_2)) {
          return this.convertURLOtherFile(match_2, match_1);
        }
        return "[" + match_1 + "](" + match_2 + ")";
      }
    );
  }

  private convertRelativePathsInDigraphBlocks(
    digraph_blocks: Array<string>,
    highlight_link_path?: string
  ) {
    for (let i = 0; i < digraph_blocks.length; i += 1) {
      digraph_blocks[i] = digraph_blocks[i].replace(
        /URL="(.*)"/g,
        (match_all, match_1) => {
          debug(`convertRelativePathsInDigraphBlocks() match: ${match_1}`);
          if (this.isURLDirectoryOrMarkdown(match_1)) {
            match_1 = this.getHash(this.getFullPathFromRelative(match_1));
          } else if (this.isURLNeedingConversion(match_1)) {
            match_1 =
              this.repo.getBaseURL() + this.getFullPathFromRelative(match_1);
          }
          return 'URL="' + match_1 + '"';
        }
      );
    }
  }

  private isURLNeedingConversion(href: string): boolean {
    // debug(`convertRelativePath(${href}) tests:
    // ${Utils.isProtocolRelativeURL(href)}
    // ${Path.isAbsolute(href)}`);

    return Utils.isProtocolRelativeURL(href) && !Path.isAbsolute(href);
  }

  private isURLDirectoryOrMarkdown(href: string): boolean {
    // debug(`convertRelativePath(${href}) tests:
    //   ${Utils.isProtocolRelativeURL(href)}
    //   ${Path.isAbsolute(href)}
    //   ${Utils.appearsToBeAFile(href)}
    //   ${Utils.isMarkdownFile(href)}`);

    return (
      Utils.isProtocolRelativeURL(href) &&
      !Path.isAbsolute(href) &&
      (!Utils.appearsToBeAFile(href) || Utils.isMarkdownFile(href))
    );
  }

  private convertURLOtherFile(href: string, label: string): string {
    var full_path = this.repo.getBaseURL() + this.getFullPathFromRelative(href);
    return "[" + label + "](" + full_path + ")";
  }

  private convertURL(
    href: string,
    label: string,
    highlight_link_path?: string
  ): string {
    var full_path = this.getFullPathFromRelative(href);
    var out = "[" + label + "](" + this.getHash(full_path) + ")";

    debug("convertURL(" + href + "): " + full_path);
    if (highlight_link_path) {
      debug("highlight_link path: " + highlight_link_path);
      if (highlight_link_path === full_path) {
        out = "**" + out + "**";
      }
    }
    return out;
  }

  private convertMarkdownToHTML(markdown: string): string {
    return marked.parse(markdown, { smartypants: true });
  }

  private separateOutDigraphBlocks(
    markdown: string,
    digraph_blocks: Array<string>
  ): string {
    const lines = markdown.split("\n");
    var out = "";
    var block_number = 0;

    // debug("separateOutDigraphBlocks() lines: " + lines.length);
    for (let i = 0; i < lines.length; i += 1) {
      if (!digraph_blocks[block_number]) {
        if (lines[i].indexOf("digraph") === 0) {
          digraph_blocks[block_number] = lines[i];
        } else {
          out += "\n" + lines[i];
        }
      } else {
        digraph_blocks[block_number] += "\n" + lines[i];
        if (lines[i].indexOf("}") > -1) {
          out += "\n¬¬DIGRAPH<" + block_number + ">¬¬";
          block_number += 1;
        }
      }
    }
    // debug(
    //   "separateOutDigraphBlocks() out: " +
    //     lines.length +
    //     ", blocks: " +
    //     block_number +
    //     ", out: " +
    //     out
    // );
    return out;
  }

  // private applyViz(html: string, digraph_blocks: Array<string>): string {
  //   const that = this;
  //   Log.trace("applyViz() : " + digraph_blocks.length);
  //   return html.replace(/¬¬DIGRAPH<(\d+)>¬¬/, function (match, match_1) {
  //     const block_number = parseInt(match_1);
  //     Log.trace("block_number: " + block_number);
  //     try {
  //       if (!digraph_blocks[block_number]) {
  //         throw new Error("no digraph block found for " + block_number);
  //       }
  //       return Viz(digraph_blocks[block_number], {
  //         format: "svg",
  //       });
  //     } catch (e) {
  //       return "<p><b>Error in Viz: " + e.toString() + "</b></p>";
  //     }
  //   });
  // }

  private getDocLinks(content) {
    var regex1 = /\]\((.*?)\)/g; // replace(regex, callback) doesn't seem to support capturing groups
    var regex2 = /URL\s*=\s*\"([\w\.\/]+)\"/g;
    var that = this;
    var matches;
    var i;

    function addLink(match) {
      if (
        match &&
        match.length > 1 &&
        match[1] &&
        that.isURLDirectoryOrMarkdown(match[1])
      ) {
        that.getRepo().getDoc(that.getFullPathFromRelative(match[1]));
      }
    }
    matches = content.match(regex1);
    for (i = 0; matches && i < matches.length; i += 1) {
      addLink(regex1.exec(matches[i]));
      regex1.exec(""); // every other call to regex.exec() returns null for some reason...!
    }
    matches = content.match(regex2);
    for (i = 0; matches && i < matches.length; i += 1) {
      addLink(regex2.exec(matches[i]));
      regex2.exec(""); // every other call to regex.exec() returns null for some reason...!
    }
  }

  private throwIfNotLoaded(): void {
    if (!this.loaded) {
      throw new Error("must only be called once loaded");
    }
  }
}
