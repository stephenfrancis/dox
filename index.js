"use strict";

const Url = require("url");
const Viz = require("viz.js");
const Q = require("q");
const Marked = require("marked");
const Jquery = require("jquery");
const IndexedDB = require("lapis/IndexedDB.js");
const Log = require("loglevel");

/*
Path Behaviour
1. path split by '/' char
2. '.' and '..' relative path operations dealt with
3. all blank path elements removed EXCEPT FOR LAST
4. last path element blank implies dir, i.e. README.md
5. for main path,
* no path or blank path implies /
* path ending in '/'' implies ending in '/README.md'
*/

window.controller = module.exports;

module.exports.start = function (selectors) {
  var that = this;
  this.selectors = selectors;
  this.caching = true;
  this.current_repo = window.location.pathname.match(/^\/(.*?)\//)[1];
  this.idb_version = 1; // integer version sequence
  this.npm_version = "0.1.0"; // TODO - get from package.json
  this.database = new IndexedDB(window.indexedDB, this.current_repo, this.idb_version);
  this.validateConfig();
  this.setupDocumentBindings();
  this.searchSetup();
  this.store = this.database.addStore("dox",
    { keyPath: "uuid", },
    [
      {
        id: "by_title",
        key_path: "payload.title",
        additional: { unique: false },
      },
    ]);

  this.database.start()
    .then(function () {
      if (that.caching) {
        return that.replicateRepoIfModified();
      }
    })
    .then(function (repo_modified) {
      if (repo_modified) {
        that.setCaching(false);
        return that.replicateRepo(that.new_commit_hash);
      }
    })
    .then(function () {
      that.hashChange();
    })
    .then(null, function (error) {
      Log.error("Error caught in start(): " + error);
    });
};


window.onhashchange = function () {
  module.exports.hashChange();
};


module.exports.validateConfig = function () {
  if (!this.selectors) {
    throw new Error("selectors is not defined");
  }
  this.elements = {};

  this.validateSelector("left_pane");
  this.validateSelector("main_pane");
  this.validateSelector("curr_location");
  this.validateSelector("caching");
  this.validateSelector("search_box");
  this.validateSelector("left_pane");

  // if (!this.store || typeof this.store.isDescendantOf !== "function"
  //     || !this.store.isDescendantOf(Store.Store)) {
  //   throw new Error("store is not defined as a descendant of Store");
  // }
  // if (typeof this.store.db_id !== "string") {
  //   throw new Error("store.db_id is not defined as a string");
  // }
  // if (typeof this.store.store_id !== "string") {
  //   throw new Error("store.store_id is not defined as a string");
  // }
};


module.exports.validateSelector = function (selector_id) {
  if (!this.selectors[selector_id]) {
    throw new Error("selectors." + selector_id + " is not defined in the selectors object");
  }
  this.elements[selector_id] = Jquery(this.selectors[selector_id]);
  if (this.elements[selector_id].length !== 1) {
    throw new Error("selectors." + selector_id + " is not a selector for a single element");
  }
};

module.exports.setupDocumentBindings = function () {
  var that = this;

  Jquery(document).on("click", "div.match_result", function (/*event*/) {
    var doc_id = Jquery(this).children("span").text();
      // uri = uriFunction(window.location.href);

    // uri.fragment(doc_id);
    // window.open(uri.toString());
    window.location.href = "#action=view&path=" + doc_id
      + "&search_match=" + encodeURIComponent(that.search_str);
  });

  Jquery(document).ready(function() {
    that.setCachingButton();
  });

  Jquery(document).on("click", module.exports.selectors.caching, function (/*event*/) {
    that.caching = Jquery(this).hasClass("active");
    that.setCaching(!that.caching);
    that.hashChange();
  });

  Jquery(document).on("submit", function (event) {
    event.preventDefault();
    return false;
  });

  // Jquery(document).on("blur", module.exports.selectors.search_box, function (/*event*/) {
  //   that.runSearch(Jquery(this).find("input").val());
  // });
  //
  // Jquery(document).on("keyup", module.exports.selectors.search_box, function (event) {
  //   if (event.keyCode === 13) {
  //     that.runSearch(Jquery(this).find("input").val());
  //   }
  // });

};


module.exports.hashChange = function () {
  var hash = Url.parse(window.location.href).hash || "";
  var params = this.processFragment(hash);

  if (!params.action) {
    params.action = "view";
  }
  Log.debug("hashChange(): " + params.action + ", " + params.path);
  if (typeof this["action_" + params.action] !== "function") {
    alert("Invalid action: " + params.action);
    return;
  }
  this["action_" + params.action](params);
};


module.exports.processFragment = function (hash) {
  var params = {};
  var pairs;

  if (hash) {
    hash = hash.substr(1);
  } else {
    hash = "";
  }
  pairs = hash.split("&");
  pairs.forEach(function (pair) {
    var parts = pair.split("=");
    if (parts.length > 1) {
      params[parts[0]] = decodeURIComponent(parts[1]);
    } else if (!params.path) {        // interpret a param without '=' as a path
      params.path = parts[0];        // if path not already specified
    }
  });
  return params;
};


module.exports.action_view = function (params) {
  var path_array = this.getPathArray(params.path, params.search_match);
  this.load(path_array);
};


module.exports.action_index = function () {
  this.listRepoDocs();
};


module.exports.action_search = function (params) {
  this.runSearch(params.term);
};


module.exports.load = function (path_array, search_match) {
  var that = this;
  var parent_path;

  if (path_array.length > 0) {
    parent_path = path_array.slice(0, path_array.length - 1);
  }
  Log.debug("load(): " + path_array.join("/") + ", parent_path: " + parent_path);

  this.elements.left_pane.removeClass("hide");
  this.elements.curr_location.removeClass("hide");

  return this.getDocFromLocalOrServer(path_array)
    .then(function (content) {
      that.convertAndDisplay(that.elements.main_pane, path_array, content);
      that.setCurrLocation(that.elements.curr_location, path_array, content);
      if (search_match) {
        that.highlightSearchMatch(that.elements.main_pane, search_match);
      }
    })
    .then(null, function (error) {
      that.elements.main_pane.html(error + " :-(");
    })
    .then(function () {
      if (parent_path) {
        return that.getDocFromLocalOrServer(parent_path);
      }
    })
    .then(function (content) {
      if (content) {
        that.convertAndDisplay(that.elements.left_pane, parent_path, content);
        that.highlightLink(that.elements.left_pane, path_array);
      } else {
        that.elements.left_pane.empty();
      }
      return path_array;
    })
    .then(null, function (error) {
      that.elements.left_pane.html(error + " :-(");
    });
};


module.exports.getPathArray = function (path_arg) {
  var path_arr;
  path_arg = path_arg || "";
  path_arr = path_arg.split("/");
  this.normalizePathArray(path_arr);
  if (path_arr[path_arr.length - 1] === "README.md") {
    path_arr.pop();
  }
  Log.debug("getPathArray(" + path_arg + "): " + path_arr);
  return path_arr;
};


module.exports.normalizePathArray = function (path_arr, addl_path_arr) {
  var i = 0;
  if (addl_path_arr) {
    path_arr = path_arr.concat(addl_path_arr);
  }
  while (i < path_arr.length) {
    if (path_arr[i] === ".." && i > 0) {
      path_arr.splice(i - 1, 2);            // remove this dir element and previous one
      i -= 1;
    } else if (path_arr[i] === "." || path_arr[i] === "") {
      path_arr.splice(i, 1);                // remove this dir element if not last
    } else {
      i += 1;
    }
  }
  return path_arr;
};


module.exports.isFile = function (path_array, alt_filename) {
  var regex = /\.[a-zA-Z]{2,4}$/;
  if (alt_filename) {
    return !!alt_filename.match(regex);
  }
  if (path_array.length < 1) {
    return false;
  }
  return !!(path_array[path_array.length - 1].match(regex));        // has a 2-4 char extension
};


module.exports.getFullPath = function (path_array, alt_filename) {
  var out = path_array.join("/");
  if (alt_filename) {
    out += (out ? "/" : "") + alt_filename;
  }
  if (!this.isFile(path_array, alt_filename)) {
    out += (out ? "/" : "") + "README.md";
  }
  return out;
};


module.exports.getFullDirectory = function (path_array) {
  var out = path_array.join("/");
  if (this.isFile(path_array)) {
    out = out.substr(0, out.lastIndexOf("/"));
  }
  return out;
};


module.exports.convertAndDisplay = function (element, path_array, content) {
  var that = this;
  var dir = this.getFullDirectory(path_array);

  Log.debug("convertAndDisplay(): " + dir);
  element.html(Marked(content, { smartypants: true }));

  element.find("table").addClass("table");            // style as TB tables

  element.find("a[href]").each(function () {
    that.convertPathAttribute(dir, Jquery(this), "href");
  });

  element.find("img[src]").each(function () {
    that.convertPathAttribute(dir, Jquery(this), "src");
  });

  element.find("p").each(function () {
    var elem_p = Jquery(this);
    if (elem_p.text().indexOf("digraph") === 0) {
      that.applyViz(elem_p, dir);
    }
  });
  Jquery(window).scrollTop(0);
};


module.exports.isRelativeURL = function (url) {
  return (url.indexOf(":") === -1
    && url.indexOf("#") !== 0
    && url.indexOf("/") !== 0
    && url.indexOf("\\") !== 0);
};


module.exports.convertPathAttribute = function (dir, selector, attr /*, prefix*/) {
  var href = this.convertPath(dir, selector.attr(attr));
  selector.attr(attr, href);
};


module.exports.convertPath = function (dir, href) {
  var type = href.match(/\.([a-zA-Z]{2,4})$/); // Directories and Markdown files prefixed with '#';
  if (this.isRelativeURL(href)) { // protocol not specified, relative URL
    href = this.getPathArray(dir + "/" + href).join("/");
    if (!type || type.length < 2 || type[1] === "md") {
      href = "#action=view&path=" + href;
    }
  }
  return href;
};


module.exports.highlightLink = function (element, path_array) {
  var match_path = "#action=view&path=";
  if (this.isFile(path_array)) {
    match_path += this.getFullPath(path_array);
  } else {
    match_path += this.getFullDirectory(path_array);
  }
  element.find("a").each(function () {
    var href = Jquery(this).attr("href") || Jquery(this).attr("xlink:href");
    if (href === match_path) {
      Jquery(this).css("font-weight", "bold");
      Jquery(this).css("text-decoration", "underline");
    }
  });
};


module.exports.highlightSearchMatch = function (selector, search_match) {
  return undefined; // TODO
};


module.exports.applyViz = function (element, dir) {
	var that = this;
  var text = element.text().replace("{", "{ " +
    " graph [ penwidth=0.1, bgcolor=transparent ]; " +
    " node  [ fontname=Arial, fontsize=9, shape=box, style=rounded ]; " +
    " edge  [ fontname=Arial, fontsize=9 ]; ");

// tried adding ", fixedsize=true, width=2" to node [] above,
// but caused issues when text width exceeded box width (2 inches) - text doesn't wrap

  text = text.replace(/[“”]/g, "\""); // Marked replaces plain double-quotes with fancy ones...
  text = text.replace(/URL="(.*?)"/g, function (match) {
    	match = match.substr(5, match.length - 6);
    	console.log(match);
    return ("URL=\"" + that.convertPath(dir, match) + "\"");
  });
  Log.debug("applyViz(): " + text);
  element.html(Viz(text, "svg"));
};


module.exports.setCurrLocation = function (element, path_array, content) {
  var i;
  var title = this.getDocTitle(path_array, content);
  var concat_path = "";

  element.empty();
  this.addBreadcrumb(element, "#action=view", this.current_repo, (path_array.length === 0));
  for (i = 0; i < path_array.length; i += 1) {
    concat_path += path_array[i] + "/";
    this.addBreadcrumb(element, "#action=view&path=" + concat_path, path_array[i], (i === path_array.length - 1));
  }
  Jquery(document).attr("title", title);
};


module.exports.addUL = function (elmt) {
  return this.createAppend(elmt, "<ul></ul>");
};


module.exports.addBulletLink = function (elmt, url, label) {
  return this.createAppend(elmt, "<li><a href='" + url + "'>" + label + "</a></li>");
};


module.exports.addBreadcrumb = function (elmt, url, label, final_part) {
  if (final_part) {
    elmt.append("<li class='active'>" + label + "</li>");
  } else {
    elmt.append("<li><a href='" + url + "'>" + label + "</a> <span class='divider'>/</span></li>");
  }
};


module.exports.createAppend = function (elmt, html_str) {
  var new_elmt = Jquery(html_str);
  elmt.append(new_elmt);
  return new_elmt;
};


module.exports.getDocFromLocalOrServer = function (path_array) {
  if (this.caching) {
    return this.getDocFromLocal(path_array);
  }
  return this.getDocFromServer(path_array);
};


// take path_array and return a Promise
module.exports.getDocFromLocal = function (path_array) {
  var path = this.getFullPath(path_array);
  return this.store.get(path)
    .then(function (doc_obj) {
      return doc_obj.payload.content;
    });
};


// take path_array and return a Promise
module.exports.getDocFromServer = function (path_array) {
  var path = this.getFullPath(path_array);
  return this.getFileFromServer({
    url: path,
    type: "GET",
    cache: false,
  });
};


// Return a Promise; options MUST contain url and type
module.exports.getFileFromServer = function (options) {
  return Q.Promise(function (resolve, reject) {
    options.success = function (content) {
      resolve(content);
    };
    options.error = function (xml_http_request, text_status) {
      reject("[" + xml_http_request.status + "] " + xml_http_request.statusText + " " + text_status);
    };
    Jquery.ajax(options);
  });
};


module.exports.getDocTitle = function (path_array, content) {
  var match = content.match(/^#\s*(.*)[\r\n]/);
  if (match) {
    return match[1];
  }
  return path_array[path_array.length - 1];
};


module.exports.getDocLinks = function (content) {
  var regex1 = /\]\((.*?)\)/g; // replace(regex, callback) doesn't seem to support capturing groups
  var regex2 = /URL\s*=\s*\"([\w\.\/]+)\"/g;
  var links = [];
  var that = this;
  var matches;
  var i;

  function addLink(match) {
    if (match && match.length > 1 && match[1] && that.isRelativeURL(match[1])) {
      links.push(match[1]);
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
    regex2.exec("");        // every other call to regex.exec() returns null for some reason...!
  }
  return links;
};


module.exports.replicateRepoIfModified = function () {
  var that = this;
  var new_commit_hash;
  var old_commit_hash;

  Log.debug("starting replicateRepoIfModified()");
  return this.getFileFromServer({
    url: ".git/HEAD",
    type: "GET",
    cache: false,
  })
    .then(function (content) {
      var ref;
      if (content) {
        ref = content.match(/ref:\ (.*)/);
      }
      if (!ref && content) {
        new_commit_hash = content.trim();
        return;
      }
      if (!ref || ref.length < 2 || !ref[1]) {
        that.throwError("No ref found: " + content);
      }
      return that.getFileFromServer({
        url: ".git/" + ref[1],
        type: "GET",
        cache: false,
      });
    })
    .then(function (content) {
      if (content) {
        new_commit_hash = content.replace(/\s+/g, "");
      }
      Log.debug("replicateRepoIfModified() new_commit_hash: " + new_commit_hash);
      return that.store.get("README.md");
    })
    .then(null, function (error) {
      Log.error("Error reported: " + error);
    })
    .then(function (doc_obj) {
      if (doc_obj) {
        Log.debug("replicateRepoIfModified() old_commit_hash: " + doc_obj.commit_hash);
        old_commit_hash = doc_obj.commit_hash;
      } else {
        Log.warn("No README.md doc found in store");
      }
      if (new_commit_hash !== old_commit_hash) {
        that.new_commit_hash = new_commit_hash;
        // that.replicateRepo(new_commit_hash);            // do in parallel, so promise is NOT returned
        return true;
      }
      return false;
    });
};


module.exports.replicateRepo = function (commit_hash) {
  var that = this;
  Log.debug("starting replicateRepo()");
  this.elements.main_pane.html("Repo has changed, downloading...");
  this.replicating = true;
  this.setCachingButton();
  this.repl_docs  = {};
  this.repl_doc_queue = [ [ "" ] ];
  // this.back_links = {};
  this.replication_count = 0;
  this.getOrAddReplDoc("README.md").commit_hash = commit_hash;

  return this.getNextQueueDocFromServerAndProcess()
    .then(function () {
      that.replicating = false;
      that.caching = true;
      that.setCachingButton();
      Log.debug("finished replicateRepo()");
    })
    .then(null, function (error) {
      that.replicating = false;
      that.setCachingButton();
      Log.error("Error in replicateRepo(): " + error);
    });
};


module.exports.getNextQueueDocFromServerAndProcess = function () {
  var that = this;
  var path_array = this.repl_doc_queue.shift();

  if (path_array) {
    Log.info("getNextQueueDocFromServerAndProcess() getting: " + path_array);
    this.replication_count += 1;
    return this.getDocFromServer(path_array)
      .then(function (content) {
        // TODO need to check that file is markdown, or skip
        // Log.info("getDocFromServerAndProcess() storing doc: " + path);
        that.processRetrievedDoc(path_array, content);
      })
      .then(null, function (error) {
        Log.error("getNextQueueDocFromServerAndProcess(): " + error);
      })
      .then(function () {
        return that.getNextQueueDocFromServerAndProcess();
      });
  }
  return that.nextDocToSave();
};


module.exports.wait = function (millis) {
  return Q.Promise(function (resolve /*, reject*/) {
    setTimeout(function () {
      resolve();
    },
    millis);
  });
};


module.exports.processRetrievedDoc = function (path_array, content) {
  var path  = this.getFullPath(path_array);
  var title = this.getDocTitle(path_array, content);
  var links = this.getDocLinks(content);
  var doc;

  if (!path.match(/\.md$/)) {
    return;
  }
  Log.info("processRetrievedDoc(): " + path + ", doc title: " + title + ", links: " + links);
  this.addKnownLinks(links, path_array);

  doc = this.getOrAddReplDoc(path);
  doc.payload = {
    title: title,
    links: links,
    content: content
  };
};


module.exports.getOrAddReplDoc = function (path) {
  if (!this.repl_docs[path]) {
    this.repl_docs[path] = { uuid: path };
    this.repl_docs[path].back_links = [];
    this.repl_doc_queue.push(this.getPathArray(path));
  }
  return this.repl_docs[path];
};


module.exports.addKnownLinks = function (links, path_array) {
  var dir = this.getFullDirectory(path_array) + "/";
  var path = this.getFullPath(path_array);
  var i;
  var link;

  for (i = 0; i < links.length; i += 1) {
    link = this.getFullPath(this.getPathArray(dir + links[i]));
    this.getOrAddReplDoc(link).back_links.push(path);
  }
};


module.exports.nextDocToSave = function () {
  var that = this;
  var path = Object.keys(this.repl_docs)[0];

  if (path) {
    Log.info("nextDocToSave() setting: " + path);
    return that.store.save(this.repl_docs[path])
      .then(null, function (error) {
        Log.error("nextDocToSave() " + error);
      })
      .then(function () {
        delete that.repl_docs[path];
        that.nextDocToSave();
      });
  }
  return Q.Promise(function (resolve /*, reject*/) {
    resolve();
  });
};


module.exports.searchSetup = function () {
  var that = this;
  Log.debug("searchSetup()");
  function runSearch(/*event*/) {
    var search_str = that.elements.search_box.val();
    if (!search_str) {
      return;
    }
    if (search_str.length < 4) {
      alert("search string should be at least 4 characters");
      return;
    }
    that.elements.search_box.val("");
    window.location.href = "#action=search&term=" + encodeURIComponent(search_str);
    // that.runSearch(search_str);
  }
  this.elements.search_box.on("blur"  , runSearch);
  this.elements.search_box.on("keyup" , function (event) {
    if (event.keyCode === 13) {
      runSearch();
    }
  });
  // Jquery(selector).typeahead({
  //     minLength: 4,        // min chars typed to trigger typeahead
  //     items    : 20,
  //     source : function (query, process) { return that.searchSource (query, process); },
  //     updater: function (item) { return that.searchUpdater(item); }
  // });
};



module.exports.runSearch = function (search_str) {
  var that = this;
  Log.debug("runSearch(): " + search_str);
  this.search_str = search_str;
  this.clearSearch(search_str);
  this.store.getAll()
    .then(function (docs) {
      that.displaySearchResults(docs, search_str);
    })
    .then(null, function (error) {
      Log.error(error.toString());
    });
};


module.exports.clearSearch = function (search_str) {
  this.elements.main_pane.empty();
  this.elements.main_pane.append("<h1>Matches for '" + search_str + "'</h1>");
  this.elements.left_pane.addClass("hide");
  this.elements.curr_location.addClass("hide");
  this.elements.search_box.find("input").val("");
};


module.exports.displaySearchResults = function (docs, search_str) {
  var that = this;
  var regex1 = new RegExp(".*" + search_str + ".*", "gi");            // danger? for the mo, treat query as a regex expr...;
  var regex2 = new RegExp(search_str, "gi");
  var added_doc_nodes = {};
  var count_doc = 0;
  var count_match = 0;
  var i;

  Log.debug("displaySearchResults() starting to match docs: " + docs.length);

  function highlightText(str) {
    if (!str) {
      return "";
    }
    return str.replace(regex2, function (match_str) {
      count_match +=1;
      return "<span class='highlight'>" + match_str + "</span>";
    });
  }

  function addDoc(doc) {
    var new_doc_node;
    that.elements.main_pane.append("<div class='match_result'><i class='icon-file' /> <b>" +
      highlightText(doc.payload.title) + "</b><span>" + doc.uuid + "</span><ul/></div>");
    new_doc_node = that.elements.main_pane.children("div.match_result").last();
    added_doc_nodes[doc.uuid] = new_doc_node;
    count_doc += 1;
    return new_doc_node;
  }

  function getOrAddDoc(doc) {
    var doc_node = added_doc_nodes[doc.uuid];
    if (!doc_node) {
      doc_node = addDoc(doc);
    }
    return doc_node;
  }

  function addMatch(match) {
    var doc_node = getOrAddDoc(docs[i]);
    Log.debug("adding a new match... " + doc_node + " ... " + match + ", " + doc_node.length);
    doc_node.find("ul").append("<li>" + highlightText(match) + "</li>");
  }

  for (i = 0; i < docs.length; i += 1) {
    if (docs[i].payload && regex2.exec(docs[i].payload.title)) {
      getOrAddDoc(docs[i]);
    }
  }

  for (i = 0; i < docs.length; i += 1) {
    if (docs[i].payload && typeof docs[i].payload.content === "string") {
      docs[i].payload.content.replace(regex1, addMatch);
    }
  }
  this.elements.main_pane.append("<div><b>" + count_match + "</b> matches across <b>" +
    count_doc + "</b> files");
  Log.debug("displaySearchResults() finished");
};


module.exports.setCaching = function (caching) {
  this.caching = caching;
  this.setCachingButton();
};


module.exports.setCachingButton = function () {
  var text = "Caching";
  if (this.replicating) {
    this.elements.caching.addClass("btn-info");
    text = "Refreshing Cache";
  } else {
    this.elements.caching.removeClass("btn-info");
    if (this.caching) {
      text += " ON";
    } else {
      text += " OFF";
    }
  }
  this.elements.caching.text(text);
  if (this.caching) {
    this.elements.caching.addClass("active");
  } else {
    this.elements.caching.removeClass("active");
  }
};


module.exports.clearCache = function () {
  var that = this;
  this.store.getAll()
    .then(function (docs) {
      Log.debug("clearCache() starting to delete docs: " + docs.length);
      docs.forEach(function (doc) {
        that.store.delete(doc);
      });
    })
    .then(null, function (error) {
      Log.error(error.toString());
    });
};


module.exports.listRepoDocs = function () {
  var that = this;
  var element;
  var found_docs = {};

  this.elements.left_pane.empty();
  this.elements.main_pane.empty();
  this.elements.main_pane.append("<p>Dox version <b>v" + this.npm_version + "</b></p>");
  this.elements.main_pane.append("<table class='table' id='repo_index'><thead><tr><th>Path / Title</th>"
    // + "<th>Last Modified</th>"
    + "<th>Internal Links</th></tr></thead><tbody/></table>");
  element = this.elements.main_pane.find("table > tbody");

  function addDoc(doc) {
    var path_arr = that.getPathArray(doc.uuid);
    var path = that.getFullPath(path_arr);
    var html = "<tr><td><a href='#" + path + "' target='_blank'>" + path + "</a>";
    html += (doc.payload ? "<br/>" + doc.payload.title : "");
    // html += "</td><td>" + doc.last_upd;
    html += "</td><td>";
    if (doc.payload && doc.payload.links && doc.uuid.match(/\.md$/)) {
      if (that.isFile(path_arr)) {
        path_arr.pop();
      }
      html += "<ul>";
      doc.payload.links.forEach(function (link) {
        html += "<li class='missing'>"
          + that.getFullPath(that.normalizePathArray(path_arr, link.split("/"))) + "</li>";
      });
      html += "</ul>";
    }
    html += "</td></tr>";
    element.append(html);
    found_docs[path] = true;
  }

  this.store.getAll()
    .then(function (docs) {
      Log.debug("listRepoDocs() starting to process docs: " + docs.length);
      docs.forEach(function (doc) {
        addDoc(doc);
      });
      element.find("li.missing").each(function () {
        var file_id = Jquery(this).text();
        if (found_docs[file_id] || !file_id.endsWith(".md")) {
          Jquery(this).removeClass("missing");
        }
      });
      Log.debug("listRepoDocs() ending");
    })
    .then(null, function (error) {
      Log.error(error.toString());
    });
};
