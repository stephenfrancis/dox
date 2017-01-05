/*global x, $, indexedDB, UUID, URI, Viz, Promise, marked, console, window, alert, document */
"use strict";


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

var uriFunction = URI,
    vizFunction = Viz,
    module = x.Base.clone({
        id          : "Reader",
        path         : null,
        parts         : null,
        page         : null,
        caching        : true,
        current_repo: null,
        replicate   : true
    });

x.Reader = module;
x.Base  .log_level = x.Base.log_levels.warn;
x.Store .log_level = x.Base.log_levels.warn;
x.Reader.log_level = x.Base.log_levels.error;

module.define("start", function () {
    this.hashChange();
});


window.onhashchange = function () {
    x.Reader.hashChange();
};


module.define("hashChange", function () {
    var fragment   = uriFunction(window.location.href).fragment(),
        params     = this.processFragment(fragment);

    if (!params.action) {
        params.action = "view";
    }
    if (typeof this["action_" + params.action] !== "function") {
        alert("Invalid action: " + params.action);
        return;
    }
    this["action_" + params.action](params);
});


module.define("processFragment", function (fragment) {
    var params = {},
        pairs  = fragment.split("&");

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


module.define("action_view", function (params) {
    var that = this,
        path_array = this.getPathArray(params.path);

    if (!path_array[0]) {
        alert("Sorry, that link isn't valid, please can you check with whoever or wherever you got it from?");
        return;
    }
    this.loadLogo(path_array[0]);
    if (path_array[0] !== this.current_repo && this.caching) {
        that.replicateRepoIfModified(path_array[0])
            .then(null, function (error) {
                that.error("Error caught in hashChange(): " + error);
            })
            .then(function (repo_modified) {
                if (repo_modified) {
                    that.setCaching(false);
                }
                that.current_repo = path_array[0];
                that.load(path_array, params.search_match);
            });
    } else {
        that.load(path_array);
    }
});


module.define("action_index", function () {
    this.listRepoDocs();
});


module.define("action_search", function (params) {
    this.runSearch(params.term);
});


module.define("load", function (path_array, search_match) {
    var that = this,
        parent_path = [];

    if (path_array.length === 0) {
        alert("path_array has no elements...");
        return;
    }
    if (path_array.length > 1) {
        parent_path = path_array.slice(0, path_array.length - 1);
    }

    $("#left_pane"    ).removeClass("hide");
    $("#curr_location").removeClass("hide");

    return this.getDocFromLocalOrServer(path_array)
        .then(function (content) {
            that.convertAndDisplay("#main_pane"  , path_array, content);
            that.setCurrLocation("#curr_location", path_array, content);
            if (search_match) {
                that.highlightSearchMatch("#main_pane", search_match);
            }
        })
        .then(null, function (error) {
            $("#main_pane").html(error + " :-(");
        })
        .then(function () {
            if (parent_path.length > 0) {
                return that.getDocFromLocalOrServer(parent_path);
            }
        })
        .then(function (content) {
            if (content) {
                that.convertAndDisplay("#left_pane" , parent_path, content);
                that.highlightLink("#left_pane", path_array);
            } else {
                $("#left_pane").empty();
            }
            return path_array;
        });
});

/*
module.define("splitParams", function (str) {
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

module.define("getPathArray", function (path_arg) {
    var path_arr;
    path_arg = path_arg || "";
    path_arr = path_arg.split("/");
    this.normalizePathArray(path_arr);
    if (path_arr[path_arr.length - 1] === "README.md") {
        path_arr.pop();
    }
    this.trace("getPathArray(" + path_arg + "): " + path_arr);
    return path_arr;
});


module.define("normalizePathArray", function (path_arr, addl_path_arr) {
    var i = 1;
    if (addl_path_arr) {
        path_arr = path_arr.concat(addl_path_arr);
    }
    while (i < path_arr.length) {
        if (path_arr[i] === "..") {
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


module.define("isFile", function (path_array, alt_filename) {
    var regex = /\.[a-zA-Z]{2,4}$/;
    if (alt_filename) {
        return !!alt_filename.match(regex);
    }
    if (path_array.length < 1) {
        return false;
    }
    return !!(path_array[path_array.length - 1].match(regex));        // has a 2-4 char extension
});


module.define("getFullPath", function (path_array, alt_filename) {
    var out = path_array.join("/");
    if (alt_filename) {
        out += (out ? "/" : "") + alt_filename;
    }
    if (!this.isFile(path_array, alt_filename)) {
        out += (out ? "/" : "") + "README.md";
    }
    return out;
});


module.define("getFullDirectory", function (path_array) {
    var out = path_array.join("/");
    if (this.isFile(path_array)) {
        out = out.substr(0, out.lastIndexOf("/"));
    }
    return out;
});


module.define("convertAndDisplay", function (selector, path_array, content) {
    var that = this,
        dir  = this.getFullDirectory(path_array);

    $(selector).html(marked(content, { smartypants: true }));

    $(selector).find("table").addClass("table");            // style as TB tables

    $(selector).find("a[href]").each(function () {
        that.convertPathAttribute(dir, $(this), "href");
    });

    $(selector).find("img[src]").each(function () {
        that.convertPathAttribute(dir, $(this), "src");
    });

    $(selector).find("p").each(function () {
        if ($(this).text().indexOf("digraph") === 0) {
            that.applyViz(this, dir);
        }
    });
    $(window).scrollTop(0);
});


module.define("isRelativeURL", function (url) {
    return (url.indexOf(":") === -1 && url.indexOf("#") !== 0 && url.indexOf("/") !== 0 && url.indexOf("\\") !== 0);
});

module.define("convertPathAttribute", function (dir, selector, attr /*, prefix*/) {
    var href = this.convertPath(dir, selector.attr(attr));
    selector.attr(attr, href);
});

module.define("convertPath", function (dir, href) {
    var type = href.match(/\.([a-zA-Z]{2,4})$/);        // Directories and Markdown files prefixed with '#';
    var prefix = (!type || type.length < 2 || type[1] === "md") ? "#action=view&path=" : "../";        // all others with '../'

    if (this.isRelativeURL(href)) {                    // protocol not specified, relative URL
        href = prefix + this.getPathArray(dir + "/" + href).join("/");
    }
    return href;
});


module.define("highlightLink", function (selector, path_array) {
    var match_path = "#action=view&path=";
    if (this.isFile(path_array)) {
        match_path += this.getFullPath(path_array);
    } else {
        match_path += this.getFullDirectory(path_array);
    }
    $(selector).find("a").each(function () {
        var href = $(this).attr("href") || $(this).attr("xlink:href");
        if (href === match_path) {
            $(this).css("font-weight", "bold");
            $(this).css("text-decoration", "underline");
        }
    });
});


module.define("highlightSearchMatch", function (selector, search_match) {
    return undefined;            // TODO
});


module.define("loadMenu", function () {
    var that = this;
    return new Promise(function (resolve, reject) {
        $.ajax({ url: "menu.html", type: "GET", cache: !that.uncache,
            success: function (data_back) {
                resolve(data_back);
            },
            error: function (ignore /*xml_http_request*/, text_status) {
                reject(text_status);
            }
        });
    }).then(function (content) {
        $("#menu_container").append(content);
    }).then(null, function (/*error*/) {
        $("#menu_container").append("<span>no menu defined - copy menu.html.template to menu.html and edit to set up menu</span>");
    });
});


module.define("loadLogo", function (repo) {
    $("#repo_logo").attr("href", "#" + repo);
    $("#repo_logo > img").attr("src", "../" + repo + "/logo.png");
});


module.define("applyViz", function (elmt, dir) {
	var that = this;
    var text = $(elmt).text().replace("{", "{ " +
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
    $(elmt).html(vizFunction(text, "svg"));
});


module.define("setCurrLocation", function (selector, path_array, content) {
    var i,
        elmt = $(selector),
        title = this.getDocTitle(path_array, content),
        concat_path = "",
        page = path_array[path_array.length - 1];

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

    $(document).attr("title", title);
//                document.title = page;

    // $("#menu_container .active").removeClass("active");
    // $("#menu_container").find("#" + path_array[0]).addClass("active");
});


module.define("addUL", function (elmt) {
    return this.createAppend(elmt, "<ul></ul>");
});


module.define("addBulletLink", function (elmt, url, label) {
    return this.createAppend(elmt, "<li><a href='" + url + "'>" + label + "</a></li>");
});


module.define("addBreadcrumb", function (elmt, url, label, final_part) {
    if (final_part) {
        elmt.append("<li class='active'><a href='" + url + "'>" + label + "</a></li>");
    } else {
        elmt.append("<li><a href='" + url + "'>" + label + "</a> <span class='divider'>/</span></li>");
    }
});


module.define("createAppend", function (elmt, html_str) {
    var new_elmt = $(html_str);
    elmt.append(new_elmt);
    return new_elmt;
});


module.define("getDocFromLocalOrServer", function (path_array) {
    if (this.caching) {
        return this.getDocFromLocal(path_array);
    }
    return this.getDocFromServer(path_array);
});


// take path_array and return a Promise
module.define("getDocFromLocal", function (path_array) {
    var path = this.getFullPath(path_array);
    return x.Store.getDoc("dox", path)
        .then(function (doc_obj) {
            return doc_obj.payload.content;
        });
});


// take path_array and return a Promise
module.define("getDocFromServer", function (path_array) {
    var path = "../" + this.getFullPath(path_array);
    return this.getFileFromServer({ url: path, type: "GET", cache: false });
});


// Return a Promise; options MUST contain url and type
module.define("getFileFromServer", function (options) {
    return new Promise(function (resolve, reject) {
        options.success = function (content) {
            resolve(content);
        };
        options.error   = function (xml_http_request, text_status) {
            reject("[" + xml_http_request.status + "] " + xml_http_request.statusText + " " + text_status);
        };
        $.ajax(options);
    });
});


module.define("getDocTitle", function (path_array, content) {
    var match = content.match(/^#\s*(.*)[\r\n]/);
    if (match) {
        return match[1];
    }
    return path_array[path_array.length - 1];
});


module.define("getDocLinks", function (content) {
    var regex1 = /\]\((.*?)\)/g,         // replace(regex, callback) doesn't seem to support capturing groups
        regex2 = /URL\s*=\s*\"([\w\.\/]+)\"/g,
        links = [],
        that  = this,
        matches,
        i;

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


module.define("replicateRepoIfModified", function (repo) {
    var that = this,
        new_commit_hash,
        old_commit_hash;

    this.debug("starting replicateRepoIfModified()");
    return this.getFileFromServer({ url: "../" + repo + "/.git/HEAD", type: "GET", cache: false })
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
                throw "No ref found: " + content + ", for repo " + repo;
            }
            return that.getFileFromServer({ url: "../" + repo + "/.git/" + ref[1], type: "GET", cache: false });
        })
        .then(function (content) {
            if (content) {
                new_commit_hash = content.replace(/\s+/g, "");
            }
            that.debug("replicateRepoIfModified() new_commit_hash: " + new_commit_hash);
            return x.Store.getDoc("dox", repo + "/README.md");
        })
        .then(null, function (error) {
            that.error("Error reported: " + error);
        })
        .then(function (doc_obj) {
            if (doc_obj) {
                that.debug("replicateRepoIfModified() old_commit_hash: " + doc_obj.commit_hash);
                old_commit_hash = doc_obj.commit_hash;
            } else {
                that.warn("No doc found for repo: " + repo);
            }
            if (new_commit_hash !== old_commit_hash) {
                that.replicateRepo(repo, new_commit_hash);            // do in parallel, so promise is NOT returned
                return true;
            }
            return false;
        });
});


module.define("replicateRepo", function (repo, commit_hash) {
    var that = this;
    this.debug("starting replicateRepo()");
    $("#main_pane").html("Repo has changed, downloading...");
    this.replicating = true;
    this.setCachingButton();
    this.repl_docs  = {};
    this.repl_doc_queue = [ [ repo ] ];
    // this.back_links = {};
    this.replication_count = 0;
    this.getOrAddReplDoc(repo + "/README.md").commit_hash = commit_hash;

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


module.define("getNextQueueDocFromServerAndProcess", function () {
    var that = this,
        path_array = this.repl_doc_queue.shift();

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


module.define("wait", function (millis) {
    return new Promise(function (resolve /*, reject*/) {
        setTimeout(function () {
            resolve();
        },
        millis);
    });
});


module.define("processRetrievedDoc", function (path_array, content) {
    var path  = this.getFullPath(path_array),
        title = this.getDocTitle(path_array, content),
        links = this.getDocLinks(content),
        doc;

    if (!path.match(/\.md$/)) {
        return;
    }
    this.info("processRetrievedDoc(): doc title: " + title + ", links: " + links);
    this.addKnownLinks(links, path_array);

    doc = this.getOrAddReplDoc(path);
    doc.payload = {
        title   : title,
        links   : links,
        content : content
    };
});


module.define("getOrAddReplDoc", function (path) {
    if (!this.repl_docs[path]) {
        this.repl_docs[path] = { uuid: path };
        this.repl_docs[path].back_links = [];
        this.repl_doc_queue.push(this.getPathArray(path));
    }
    return this.repl_docs[path];
});


module.define("addKnownLinks", function (links, path_array) {
    var dir  = this.getFullDirectory(path_array) + "/",
        path = this.getFullPath(path_array),
        i,
        link;

    for (i = 0; i < links.length; i += 1) {
        link = this.getFullPath(this.getPathArray(dir + links[i]));
        this.getOrAddReplDoc(link).back_links.push(path);
    }
});


module.define("nextDocToSave", function () {
    var that = this,
        path = Object.keys(this.repl_docs)[0];

    if (path) {
        this.info("nextDocToSave() setting: " + path);
        return x.Store.storeDoc("dox", this.repl_docs[path])
            .then(null, function (error) {
                that.error("nextDocToSave() " + error);
            })
            .then(function () {
                delete that.repl_docs[path];
                that.nextDocToSave();
            });
    }
    return new Promise(function (resolve /*, reject*/) {
        resolve();
    });
});


$(document).on("submit", function (event) {
    event.preventDefault();
    return false;
});


module.define("searchSetup", function (selector) {
    // var that = this;
    this.debug("searchSetup(): " + selector);
    function runSearch(/*event*/) {
        var search_str = $(selector).val();
        if (!search_str) {
            return;
        }
        $(selector).val("");
        if (search_str.length < 4) {
            alert("search string should be at least 4 characters");
            return;
        }
        window.location.href = "#action=search&term=" + encodeURIComponent(search_str);
        // that.runSearch(search_str);
    }
    $(selector).on("blur"  , runSearch);
    $(selector).on("keyup" , function (event) {
        if (event.keyCode === 13) {
            runSearch();
        }
    });
    // $(selector).typeahead({
    //     minLength: 4,        // min chars typed to trigger typeahead
    //     items    : 20,
    //     source : function (query, process) { return that.searchSource (query, process); },
    //     updater: function (item) { return that.searchUpdater(item); }
    // });
});



module.define("runSearch", function (search_str) {
    var that = this;
    this.debug("runSearch(): " + search_str);
    this.search_str = search_str;
    this.clearSearch(search_str);
    x.Store.getAllDocs("dox")
        .then(function (docs) {
            that.displaySearchResults(docs, search_str);
        })
        .then(null, function (error) {
            that.error(error.toString());
        });
});

module.define("clearSearch", function (search_str) {
    $("#main_pane").empty();
    $("#main_pane").append("<h1>Matches for '" + search_str + "'</h1>");
    $("#left_pane"    ).addClass("hide");
    $("#curr_location").addClass("hide");
});


module.define("displaySearchResults", function (docs, search_str) {
    var that = this,
        root_selector = $("#main_pane"),
        regex1 = new RegExp(".*" + search_str + ".*", "gi"),            // danger? for the mo, treat query as a regex expr...;
        regex2 = new RegExp(search_str, "gi"),
        added_doc_nodes = {},
        count_doc = 0,
        count_match = 0,
        i;

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
        if (docs[i].uuid.indexOf(this.current_repo) === 0 && docs[i].payload && regex2.exec(docs[i].payload.title)) {
            getOrAddDoc(docs[i]);
        }
    }

    for (i = 0; i < docs.length; i += 1) {
        if (docs[i].uuid.indexOf(this.current_repo) === 0 && docs[i].payload && typeof docs[i].payload.content === "string") {
            docs[i].payload.content.replace(regex1, addMatch);
        }
    }
    root_selector.append("<div><b>" + count_match + "</b> matches across <b>" + count_doc + "</b> files");
    this.debug("displaySearchResults() finished");
});

$(document).on("click", "div.match_result", function (/*event*/) {
    var doc_id = $(this).children("span").text();
        // uri = uriFunction(window.location.href);

    // uri.fragment(doc_id);
    // window.open(uri.toString());
    window.location.href = "#action=view&path=" + doc_id + "&search_match=" + encodeURIComponent(x.Reader.search_str);
});


$(document).ready(function() {
    x.Reader.setCachingButton();
});


$(document).on("click", "#caching", function (/*event*/) {
    x.Reader.caching = $(this).hasClass("active");
    x.Reader.setCachingButton();
    x.Reader.hashChange();
//    x.Reader.clearCache();
});


module.define("setCaching", function (caching) {
    this.caching = caching;
    this.setCachingButton();
});


module.define("setCachingButton", function () {
    var text = "Caching";
    if (this.replicating) {
        $("#caching").   addClass("btn-info");
        text = "Refreshing Cache";
    } else {
        $("#caching").removeClass("btn-info");
        if (this.caching) {
            text += " ON";
        } else {
            text += " OFF";
        }
    }
    $("#caching").text(text);
    if (this.caching) {
        $("#caching").   addClass("active");
    } else {
        $("#caching").removeClass("active");
    }
});


module.define("clearCache", function () {
    var that = this;
    x.Store.getAllDocs("dox")
    .then(function (docs) {
        that.debug("clearCache() starting to delete docs: " + docs.length);
        docs.forEach(function (doc) {
            x.Store.deleteDoc("dox", doc);
        });
    })
    .then(null, function (error) {
        that.error(error.toString());
    });
});



// $(document).on("click", "#list_docs", function (/*event*/) {
//     x.Reader.listRepoDocs();
// });

module.define("listRepoDocs", function () {
    var that = this,
        repo = this.current_repo,
        elem = $("#main_pane"),
        found_docs = {};

    elem.empty();
    elem.append("<table class='table' id='repo_index'><thead><tr><th>Path / Title</th><th>Last Modified</th><th>Internal Links</th></tr></thead><tbody/></table>");
    elem = elem.find("table > tbody");

    function addDoc(doc) {
        var html,
            path_arr = that.getPathArray(doc.uuid),
            path;

        if (path_arr.shift() !== repo) {        // omit repo id from beginning of dir
            return;                // filter on chosen repo
        }
        path  = that.getFullPath(path_arr);
        html  = "<tr><td><a href='#" + repo + "/" + path + "' target='_blank'>" + path + "</a>";
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


    x.Store.getAllDocs("dox")
        .then(function (docs) {
            that.debug("listRepoDocs() starting to process docs: " + docs.length);
            docs.forEach(function (doc) {
                addDoc(doc);
            });
            elem.find("li.missing").each(function () {
                var file_id = $(this).text();
                if (found_docs[file_id] || !file_id.endsWith(".md")) {
                    $(this).removeClass("missing");
                }
            });
            that.debug("listRepoDocs() ending");
        })
        .then(null, function (error) {
            that.error(error.toString());
        });
});
