"use strict";

var url = require("url");
var viz = require("viz.js");
var Q = require("q");
var marked = require("marked");
var jQuery = require("jquery");
var Core = require("lapis-core");
var Store = require("lapis-store");

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


module.exports = Core.Base.clone({
    id: "Controller",
    path: null,
    parts: null,
    page: null,
    caching: true,
    current_repo: url.parse(window.location.href).pathname.replace(/\//g, ""),
    replicate: true,
});


if (window) {
    window.controller = module.exports;
}

module.exports.store = Store.StoreIndexedDB.clone({
    id: "StoreIndexedDB",
    db_id: module.exports.current_repo,  // string database name
    store_id: "dox",             // string store name
    version: 15,                  // integer version sequence
    create_properties: { keyPath: "uuid", },
    indexes: [
        {
            id: "by_title",
            key_path: "payload.title",
            additional: { unique: false },
        },
    ],
});


Core.Base.setLogLevel(Core.Base.log_levels.debug);


module.exports.define("start", function (spec) {
    var that = this;
    this.addProperties(spec);
    this.validateConfig();
    this.setupDocumentBindings();
    this.store.start()
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
        that.error("Error caught in start(): " + error);
    });
});


window.onhashchange = function () {
    module.exports.hashChange();
};


module.exports.define("validateConfig", function () {
    if (!this.selectors) {
        this.throwError("selectors is not defined");
    }
    if (!this.selectors.left_pane || jQuery(this.selectors.left_pane).length !== 1) {
        this.throwError("selectors.left_pane is not defined as a selector for a single element");
    }
    if (!this.selectors.main_pane || jQuery(this.selectors.main_pane).length !== 1) {
        this.throwError("selectors.main_pane is not defined as a selector for a single element");
    }
    if (!this.selectors.curr_location || jQuery(this.selectors.curr_location).length !== 1) {
        this.throwError("selectors.curr_location is not defined as a selector for a single element");
    }
    if (!this.selectors.caching || jQuery(this.selectors.caching).length !== 1) {
        this.throwError("selectors.caching is not defined as a selector for a single element");
    }
    if (!this.store || typeof this.store.isDescendantOf !== "function" || !this.store.isDescendantOf(Store.Store)) {
        this.throwError("store is not defined as a descendant of Store");
    }
    if (typeof this.store.db_id !== "string") {
        this.throwError("store.db_id is not defined as a string");
    }
    if (typeof this.store.store_id !== "string") {
        this.throwError("store.store_id is not defined as a string");
    }
});


module.exports.define("setupDocumentBindings", function () {
    var that = this;

    jQuery(document).on("click", "div.match_result", function (/*event*/) {
        var doc_id = jQuery(this).children("span").text();
            // uri = uriFunction(window.location.href);

        // uri.fragment(doc_id);
        // window.open(uri.toString());
        window.location.href = "#action=view&path=" + doc_id + "&search_match=" + encodeURIComponent(that.search_str);
    });

    jQuery(document).ready(function() {
        that.setCachingButton();
    });

    jQuery(document).on("click", module.exports.selectors.caching, function (/*event*/) {
        that.caching = jQuery(this).hasClass("active");
        that.setCaching(!that.caching);
        that.hashChange();
    //    x.Reader.clearCache();
    });

    jQuery(document).on("submit", function (event) {
        event.preventDefault();
        return false;
    });
});


module.exports.define("hashChange", function () {
    var hash = url.parse(window.location.href).hash || "";
    var params = this.processFragment(hash);

    if (!params.action) {
        params.action = "view";
    }
    this.debug("hashChange(): " + params.action + ", " + params.path);
    if (typeof this["action_" + params.action] !== "function") {
        alert("Invalid action: " + params.action);
        return;
    }
    this["action_" + params.action](params);
});


module.exports.define("processFragment", function (hash) {
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
});


module.exports.define("action_view", function (params) {
    var path_array = this.getPathArray(params.path);
    this.load(path_array);
});


module.exports.define("action_index", function () {
    this.listRepoDocs();
});


module.exports.define("action_search", function (params) {
    this.runSearch(params.term);
});


module.exports.define("load", function (path_array, search_match) {
    var that = this;
    var parent_path = [];

    this.debug("load(): " + path_array.join("/"));
    if (path_array.length > 0) {
        parent_path = path_array.slice(0, path_array.length - 1);
    }

    jQuery(this.selectors.left_pane).removeClass("hide");
    jQuery(this.selectors.curr_location).removeClass("hide");

    return this.getDocFromLocalOrServer(path_array)
    .then(function (content) {
        that.convertAndDisplay(that.selectors.main_pane, path_array, content);
        that.setCurrLocation(that.selectors.curr_location, path_array, content);
        if (search_match) {
            that.highlightSearchMatch(that.selectors.main_pane, search_match);
        }
    })
    .then(null, function (error) {
        jQuery(that.selectors.main_pane).html(error + " :-(");
    })
    .then(function () {
        if (parent_path.length > 0) {
            return that.getDocFromLocalOrServer(parent_path);
        }
    })
    .then(function (content) {
        if (content) {
            that.convertAndDisplay(that.selectors.left_pane, parent_path, content);
            that.highlightLink(that.selectors.left_pane, path_array);
        } else {
            jQuery(that.selectors.left_pane).empty();
        }
        return path_array;
    })
    .then(null, function (error) {
        jQuery(that.selectors.left_pane).html(error + " :-(");
    });
});

/*
module.exports.define("splitParams", function (str) {
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = str,
        out = {};
    e = r.exec(q);
    while (e) {
        out[d(e[1])] = d(e[2]);
        e = r.exec(q);
    }
    return out;
});
*/

module.exports.define("getPathArray", function (path_arg) {
    var path_arr;
    path_arg = path_arg || "";
    path_arr = path_arg.split("/");
    this.normalizePathArray(path_arr);
    if (path_arr[path_arr.length - 1] === "README.md") {
        path_arr.pop();
    }
    this.debug("getPathArray(" + path_arg + "): " + path_arr);
    return path_arr;
});


module.exports.define("normalizePathArray", function (path_arr, addl_path_arr) {
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
});


module.exports.define("isFile", function (path_array, alt_filename) {
    var regex = /\.[a-zA-Z]{2,4}$/;
    if (alt_filename) {
        return !!alt_filename.match(regex);
    }
    if (path_array.length < 1) {
        return false;
    }
    return !!(path_array[path_array.length - 1].match(regex));        // has a 2-4 char extension
});


module.exports.define("getFullPath", function (path_array, alt_filename) {
    var out = path_array.join("/");
    if (alt_filename) {
        out += (out ? "/" : "") + alt_filename;
    }
    if (!this.isFile(path_array, alt_filename)) {
        out += (out ? "/" : "") + "README.md";
    }
    return out;
});


module.exports.define("getFullDirectory", function (path_array) {
    var out = path_array.join("/");
    if (this.isFile(path_array)) {
        out = out.substr(0, out.lastIndexOf("/"));
    }
    return out;
});


module.exports.define("convertAndDisplay", function (selector, path_array, content) {
    var that = this;
    var dir  = this.getFullDirectory(path_array);

    this.debug("convertAndDisplay(): " + dir);
    jQuery(selector).html(marked(content, { smartypants: true }));

    jQuery(selector).find("table").addClass("table");            // style as TB tables

    jQuery(selector).find("a[href]").each(function () {
        that.convertPathAttribute(dir, jQuery(this), "href");
    });

    jQuery(selector).find("img[src]").each(function () {
        that.convertPathAttribute(dir, jQuery(this), "src");
    });

    jQuery(selector).find("p").each(function () {
        if (jQuery(this).text().indexOf("digraph") === 0) {
            that.applyViz(this, dir);
        }
    });
    jQuery(window).scrollTop(0);
});


module.exports.define("isRelativeURL", function (url) {
    return (url.indexOf(":") === -1 && url.indexOf("#") !== 0 && url.indexOf("/") !== 0 && url.indexOf("\\") !== 0);
});

module.exports.define("convertPathAttribute", function (dir, selector, attr /*, prefix*/) {
    var href = this.convertPath(dir, selector.attr(attr));
    selector.attr(attr, href);
});

module.exports.define("convertPath", function (dir, href) {
    var type = href.match(/\.([a-zA-Z]{2,4})$/);        // Directories and Markdown files prefixed with '#';
    var prefix = (!type || type.length < 2 || type[1] === "md") ? "#action=view&path=" : "../";        // all others with '../'

    if (this.isRelativeURL(href)) {                    // protocol not specified, relative URL
        href = prefix + this.getPathArray(dir + "/" + href).join("/");
    }
    return href;
});


module.exports.define("highlightLink", function (selector, path_array) {
    var match_path = "#action=view&path=";
    if (this.isFile(path_array)) {
        match_path += this.getFullPath(path_array);
    } else {
        match_path += this.getFullDirectory(path_array);
    }
    jQuery(selector).find("a").each(function () {
        var href = jQuery(this).attr("href") || jQuery(this).attr("xlink:href");
        if (href === match_path) {
            jQuery(this).css("font-weight", "bold");
            jQuery(this).css("text-decoration", "underline");
        }
    });
});


module.exports.define("highlightSearchMatch", function (selector, search_match) {
    return undefined;            // TODO
});


module.exports.define("applyViz", function (elmt, dir) {
	var that = this;
    var text = jQuery(elmt).text().replace("{", "{ " +
        " graph [ penwidth=0.1, bgcolor=transparent ]; " +
        " node  [ fontname=Arial, fontsize=9, shape=box, style=rounded ]; " +
        " edge  [ fontname=Arial, fontsize=9 ]; ");

// tried adding ", fixedsize=true, width=2" to node [] above, but caused issues when text width exceeded box width (2 inches) - text doesn't wrap

    text = text.replace(/[“”]/g, "\"");            // marked replaces plain double-quotes with fancy ones...
    text = text.replace(/URL="(.*?)"/g, function (match) {
    	match = match.substr(5, match.length - 6);
    	console.log(match);
        return ("URL=\"" + that.convertPath(dir, match) + "\"");
    });
    this.debug("applyViz(): " + text);
    jQuery(elmt).html(viz(text, "svg"));
});


module.exports.define("setCurrLocation", function (selector, path_array, content) {
    var i;
    var elmt = jQuery(selector);
    var title = this.getDocTitle(path_array, content);
    var concat_path = "";
    var page = path_array[path_array.length - 1];

    elmt.empty();
    for (i = 0; i < path_array.length - 1; i += 1) {
        concat_path += path_array[i] + "/";
        this.addBreadcrumb(elmt, "#action=view&path=" + concat_path, path_array[i]);
        // elmt = this.addUL(elmt);
        // elmt = this.addBulletLink(elmt, "#" + concat_path + "README.md", path_array[i]);
    }
    elmt.append("<li class='active'>" + page + "</li>");
    // this.addBreadcrumb(elmt, "#" + concat_path + page, page, true);
    // elmt = this.addUL(elmt);
    // elmt = this.addBulletLink(elmt, "#" + concat_path + page, page);

    jQuery(document).attr("title", title);
//                document.title = page;

    // jQuery("#menu_container .active").removeClass("active");
    // jQuery("#menu_container").find("#" + path_array[0]).addClass("active");
});


module.exports.define("addUL", function (elmt) {
    return this.createAppend(elmt, "<ul></ul>");
});


module.exports.define("addBulletLink", function (elmt, url, label) {
    return this.createAppend(elmt, "<li><a href='" + url + "'>" + label + "</a></li>");
});


module.exports.define("addBreadcrumb", function (elmt, url, label, final_part) {
    if (final_part) {
        elmt.append("<li class='active'><a href='" + url + "'>" + label + "</a></li>");
    } else {
        elmt.append("<li><a href='" + url + "'>" + label + "</a> <span class='divider'>/</span></li>");
    }
});


module.exports.define("createAppend", function (elmt, html_str) {
    var new_elmt = jQuery(html_str);
    elmt.append(new_elmt);
    return new_elmt;
});


module.exports.define("getDocFromLocalOrServer", function (path_array) {
    if (this.caching) {
        return this.getDocFromLocal(path_array);
    }
    return this.getDocFromServer(path_array);
});


// take path_array and return a Promise
module.exports.define("getDocFromLocal", function (path_array) {
    var path = this.getFullPath(path_array);
    return this.store.get(path)
    .then(function (doc_obj) {
        return doc_obj.payload.content;
    });
});


// take path_array and return a Promise
module.exports.define("getDocFromServer", function (path_array) {
    var path = this.getFullPath(path_array);
    return this.getFileFromServer({ url: path, type: "GET", cache: false });
});


// Return a Promise; options MUST contain url and type
module.exports.define("getFileFromServer", function (options) {
    return Q.Promise(function (resolve, reject) {
        options.success = function (content) {
            resolve(content);
        };
        options.error   = function (xml_http_request, text_status) {
            reject("[" + xml_http_request.status + "] " + xml_http_request.statusText + " " + text_status);
        };
        jQuery.ajax(options);
    });
});


module.exports.define("getDocTitle", function (path_array, content) {
    var match = content.match(/^#\s*(.*)[\r\n]/);
    if (match) {
        return match[1];
    }
    return path_array[path_array.length - 1];
});


module.exports.define("getDocLinks", function (content) {
    var regex1 = /\]\((.*?)\)/g;         // replace(regex, callback) doesn't seem to support capturing groups
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
        regex1.exec("");        // every other call to regex.exec() returns null for some reason...!
    }
    matches = content.match(regex2);
    for (i = 0; matches && i < matches.length; i += 1) {
        addLink(regex2.exec(matches[i]));
        regex2.exec("");        // every other call to regex.exec() returns null for some reason...!
    }
    return links;
});


module.exports.define("replicateRepoIfModified", function () {
    var that = this;
    var new_commit_hash;
    var old_commit_hash;

    this.debug("starting replicateRepoIfModified()");
    return this.getFileFromServer({ url: ".git/HEAD", type: "GET", cache: false })
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
        return that.getFileFromServer({ url: ".git/" + ref[1], type: "GET", cache: false });
    })
    .then(function (content) {
        if (content) {
            new_commit_hash = content.replace(/\s+/g, "");
        }
        that.debug("replicateRepoIfModified() new_commit_hash: " + new_commit_hash);
        return that.store.get("README.md");
    })
    .then(null, function (error) {
        that.error("Error reported: " + error);
    })
    .then(function (doc_obj) {
        if (doc_obj) {
            that.debug("replicateRepoIfModified() old_commit_hash: " + doc_obj.commit_hash);
            old_commit_hash = doc_obj.commit_hash;
        } else {
            that.warn("No README.md doc found in store");
        }
        if (new_commit_hash !== old_commit_hash) {
            that.new_commit_hash = new_commit_hash;
            // that.replicateRepo(new_commit_hash);            // do in parallel, so promise is NOT returned
            return true;
        }
        return false;
    });
});


module.exports.define("replicateRepo", function (commit_hash) {
    var that = this;
    this.debug("starting replicateRepo()");
    jQuery(this.selectors.main_pane).html("Repo has changed, downloading...");
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
            that.caching     = true;
            that.setCachingButton();
            that.debug("finished replicateRepo()");
        })
        .then(null, function (error) {
            that.replicating = false;
            that.setCachingButton();
            that.error("Error in replicateRepo(): " + error);
        });
});


module.exports.define("getNextQueueDocFromServerAndProcess", function () {
    var that = this;
    var path_array = this.repl_doc_queue.shift();

    if (path_array) {
        this.info("getNextQueueDocFromServerAndProcess() getting: " + path_array);
        this.replication_count += 1;
        return this.getDocFromServer(path_array)
        .then(function (content) {
            // TODO need to check that file is markdown, or skip
            // that.info("getDocFromServerAndProcess() storing doc: " + path);
            that.processRetrievedDoc(path_array, content);
        })
        .then(null, function (error) {
            that.error("getNextQueueDocFromServerAndProcess(): " + error);
        })
        .then(function () {
            return that.getNextQueueDocFromServerAndProcess();
        });
    }
    return that.nextDocToSave();
});


module.exports.define("wait", function (millis) {
    return Q.Promise(function (resolve /*, reject*/) {
        setTimeout(function () {
            resolve();
        },
        millis);
    });
});


module.exports.define("processRetrievedDoc", function (path_array, content) {
    var path  = this.getFullPath(path_array);
    var title = this.getDocTitle(path_array, content);
    var links = this.getDocLinks(content);
    var doc;

    if (!path.match(/\.md$/)) {
        return;
    }
    this.info("processRetrievedDoc(): " + path + ", doc title: " + title + ", links: " + links);
    this.addKnownLinks(links, path_array);

    doc = this.getOrAddReplDoc(path);
    doc.payload = {
        title   : title,
        links   : links,
        content : content
    };
});


module.exports.define("getOrAddReplDoc", function (path) {
    if (!this.repl_docs[path]) {
        this.repl_docs[path] = { uuid: path };
        this.repl_docs[path].back_links = [];
        this.repl_doc_queue.push(this.getPathArray(path));
    }
    return this.repl_docs[path];
});


module.exports.define("addKnownLinks", function (links, path_array) {
    var dir  = this.getFullDirectory(path_array) + "/";
    var path = this.getFullPath(path_array);
    var i;
    var link;

    for (i = 0; i < links.length; i += 1) {
        link = this.getFullPath(this.getPathArray(dir + links[i]));
        this.getOrAddReplDoc(link).back_links.push(path);
    }
});


module.exports.define("nextDocToSave", function () {
    var that = this;
    var path = Object.keys(this.repl_docs)[0];

    if (path) {
        this.info("nextDocToSave() setting: " + path);
        return that.store.save(this.repl_docs[path])
            .then(null, function (error) {
                that.error("nextDocToSave() " + error);
            })
            .then(function () {
                delete that.repl_docs[path];
                that.nextDocToSave();
            });
    }
    return Q.Promise(function (resolve /*, reject*/) {
        resolve();
    });
});


module.exports.define("searchSetup", function (selector) {
    // var that = this;
    this.debug("searchSetup(): " + selector);
    function runSearch(/*event*/) {
        var search_str = jQuery(selector).val();
        if (!search_str) {
            return;
        }
        jQuery(selector).val("");
        if (search_str.length < 4) {
            alert("search string should be at least 4 characters");
            return;
        }
        window.location.href = "#action=search&term=" + encodeURIComponent(search_str);
        // that.runSearch(search_str);
    }
    jQuery(selector).on("blur"  , runSearch);
    jQuery(selector).on("keyup" , function (event) {
        if (event.keyCode === 13) {
            runSearch();
        }
    });
    // jQuery(selector).typeahead({
    //     minLength: 4,        // min chars typed to trigger typeahead
    //     items    : 20,
    //     source : function (query, process) { return that.searchSource (query, process); },
    //     updater: function (item) { return that.searchUpdater(item); }
    // });
});



module.exports.define("runSearch", function (search_str) {
    var that = this;
    this.debug("runSearch(): " + search_str);
    this.search_str = search_str;
    this.clearSearch(search_str);
    this.store.getAll()
    .then(function (docs) {
        that.displaySearchResults(docs, search_str);
    })
    .then(null, function (error) {
        that.error(error.toString());
    });
});


module.exports.define("clearSearch", function (search_str) {
    jQuery(this.selectors.main_pane).empty();
    jQuery(this.selectors.main_pane).append("<h1>Matches for '" + search_str + "'</h1>");
    jQuery(this.selectors.left_pane).addClass("hide");
    jQuery(this.selectors.curr_location).addClass("hide");
});


module.exports.define("displaySearchResults", function (docs, search_str) {
    var that = this;
    var root_selector = jQuery(this.selectors.main_pane);
    var regex1 = new RegExp(".*" + search_str + ".*", "gi");            // danger? for the mo, treat query as a regex expr...;
    var regex2 = new RegExp(search_str, "gi");
    var added_doc_nodes = {};
    var count_doc = 0;
    var count_match = 0;
    var i;

    this.debug("displaySearchResults() starting to match docs: " + docs.length);

    function highlightText(str) {
        return str.replace(regex2, function (match_str) {
            count_match +=1;
            return "<span class='highlight'>" + match_str + "</span>";
        });
    }

    function addDoc(doc) {
        var new_doc_node;
        root_selector.append("<div class='match_result'><i class='icon-file' /> <b>" +
            highlightText(doc.payload.title) + "</b><span>" + doc.uuid + "</span><ul/></div>");
        new_doc_node = root_selector.children("div.match_result").last();
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
        that.debug("adding a new match... " + doc_node + " ... " + match + ", " + doc_node.length);
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
    root_selector.append("<div><b>" + count_match + "</b> matches across <b>" + count_doc + "</b> files");
    this.debug("displaySearchResults() finished");
});


module.exports.define("setCaching", function (caching) {
    this.caching = caching;
    this.setCachingButton();
});


module.exports.define("setCachingButton", function () {
    var text = "Caching";
    if (this.replicating) {
        jQuery(this.selectors.caching).addClass("btn-info");
        text = "Refreshing Cache";
    } else {
        jQuery(this.selectors.caching).removeClass("btn-info");
        if (this.caching) {
            text += " ON";
        } else {
            text += " OFF";
        }
    }
    jQuery(this.selectors.caching).text(text);
    if (this.caching) {
        jQuery(this.selectors.caching).addClass("active");
    } else {
        jQuery(this.selectors.caching).removeClass("active");
    }
});


module.exports.define("clearCache", function () {
    var that = this;
    this.store.getAll()
    .then(function (docs) {
        that.debug("clearCache() starting to delete docs: " + docs.length);
        docs.forEach(function (doc) {
            that.store.delete(doc);
        });
    })
    .then(null, function (error) {
        that.error(error.toString());
    });
});


// jQuery(document).on("click", "#list_docs", function (/*event*/) {
//     x.Reader.listRepoDocs();
// });

module.exports.define("listRepoDocs", function () {
    var that = this;
    var elem = jQuery(this.selectors.main_pane);
    var found_docs = {};

    elem.empty();
    elem.append("<table class='table' id='repo_index'><thead><tr><th>Path / Title</th><th>Last Modified</th><th>Internal Links</th></tr></thead><tbody/></table>");
    elem = elem.find("table > tbody");

    function addDoc(doc) {
        var path_arr = that.getPathArray(doc.uuid);
        var path = that.getFullPath(path_arr);
        var html = "<tr><td><a href='#" + path + "' target='_blank'>" + path + "</a>";
        html += (doc.payload ? "<br/>" + doc.payload.title : "");
        html += "</td><td>" + doc.last_upd + "</td><td>";
        if (doc.payload && doc.payload.links && doc.uuid.match(/\.md$/)) {
            if (that.isFile(path_arr)) {
                path_arr.pop();
            }
            html += "<ul>";
            doc.payload.links.forEach(function (link) {
                html += "<li class='missing'>" + that.getFullPath(that.normalizePathArray(path_arr, link.split("/"))) + "</li>";
            });
            html += "</ul>";
        }
        html += "</td></tr>";
        elem.append(html);
        found_docs[path] = true;
    }

    this.store.getAll()
    .then(function (docs) {
        that.debug("listRepoDocs() starting to process docs: " + docs.length);
        docs.forEach(function (doc) {
            addDoc(doc);
        });
        elem.find("li.missing").each(function () {
            var file_id = jQuery(this).text();
            if (found_docs[file_id] || !file_id.endsWith(".md")) {
                jQuery(this).removeClass("missing");
            }
        });
        that.debug("listRepoDocs() ending");
    })
    .then(null, function (error) {
        that.error(error.toString());
    });
});
