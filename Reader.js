/*jslint browser: true */
/*global x, $, indexedDB, UUID, Promise, console */


/*
Path Behvaiour
1. path split by '/' char
2. '.' and '..' relative path operations dealt with
3. all blank path elements removed EXCEPT FOR LAST
4. last path element blank implies dir, i.e. README.md
5. for main path,
* no path or blank path implies /
* / implies /{default_repo}/
* path ending in '/'' implies ending in '/README.md'
*/

var module = x.Base.clone({
    id          : "Reader",
    path 		: null,
    parts 		: null,
    page 		: null,
	default_repo: "rsl-app-docs",		// TODO - don't want this hard-coded
	caching		: true,
	current_repo: null,
	replicate   : true
});

x.Reader = module;
x.Base  .log_level = x.Base.log_levels.warn;
x.Store .log_level = x.Base.log_levels.warn;
x.Reader.log_level = x.Base.log_levels.error;

module.define("start", function () {
	this.main();
});


module.define("getLocationPathArray", function () {
	var uri = URI(window.location.href),
		path = uri.fragment(),
		path_array = this.getPathArray(path);

	if (path_array.length === 0 || (path_array.length === 1 && path_array[0] === "")) {
		path_array = [ this.default_repo ];
	}
	return path_array;
});


module.define("main", function () {
	var that = this,
		path_array = this.getLocationPathArray(),
		repo = path_array[0];

	that.load(path_array);
	that.loadMenu()
	.then(function () {
		return that.replicateRepoIfModified(repo);
	})
	.then(null, function (error) {
		that.error("Error caught in main(): " + error);
	});
});


window.onhashchange = function () {
	x.Reader.hashChange();
};


module.define("hashChange", function () {
	var that = this,
		path_array = this.getLocationPathArray();

	that.load(path_array);
	if (path_array[0] !== this.current_repo) {
		that.replicateRepoIfModified(path_array[0])
		.then(function () {
			that.current_repo = path_array[0];
		});
	}
});


module.define("load", function (path_array) {
	var that = this,
		parent_path = [],
		start_promise;

	if (path_array.length === 0) {
		alert("path_array has no elements...");
		return;
	}
	if (path_array.length > 1) {
		parent_path = path_array.slice(0, path_array.length - 1);
	}

	$("#left_pane"    ).removeClass("hide");
	$("#curr_location").removeClass("hide");

    return new Promise(function (resolve, reject) {
    	resolve();
    })
	.then(function () {
		if (!that.caching) {
			throw "not caching";
		}
		return that.getDocFromLocal(path_array)
	})
	.then(null, function (error) {
		var path = "../" + that.getFullPath(path_array);
		that.error("load() error: " + error + " for (main) path: " + path);
		return that.getDocFromServer({ url: path, type: "GET", cache: false });
	})
	.then(function (content) {
		that.convertAndDisplay("#main_pane"  , path_array, content);
		that.setCurrLocation("#curr_location", path_array, content);
	})
	.then(null, function (error) {
		$("#main_pane").html(error + " :-(");
	})
	.then(function () {
		if (parent_path.length > 0) {
			if (!that.caching) {
				throw "not caching";
			}
			return that.getDocFromLocal(parent_path);
		}
	})
	.then(null, function (error) {
		var path = "../" + that.getFullPath(parent_path);
		that.error("load() error: " + error + " for (parent) path: " + path);
		return that.getDocFromServer({ url: path, type: "GET", cache: false });
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


module.define("getPathArray", function (path_arg) {
	var i = 1,
		path_array = (path_arg || "").split("/");

	// while (path_array.length > 0 && path_array[0] === "") {
	// 	path_array.shift();
	// }
	while (i < path_array.length) {
		if (path_array[i] === "..") {
			path_array.splice(i - 1, 2);			// remove this dir element and previous one
			i -= 1;
		} else if (path_array[i] === "." || path_array[i] === "") {
			path_array.splice(i, 1);				// remove this dir element if not last
		} else {
			i += 1;
		}
	}
	if (path_array[i - 1] === "README.md") {
		path_array.pop();
	}
	this.trace("getPathArray(" + path_arg + "): " + path_array);
	return path_array;
});


module.define("isFile", function (path_array) {
	if (path_array.length < 1) {
		return false;
	}
	return (path_array[path_array.length - 1].match(/\.[a-z]{2,4}$/));		// has a 2-4 char extension
});


module.define("getFullPath", function (path_array) {
	return path_array.join("/") + (this.isFile(path_array) ? "" : "/README.md");
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

	$(selector).find("table").addClass("table");			// style as TB tables

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
});


module.define("convertPathAttribute", function (dir, selector, attr) {
	var href = selector.attr(attr);
	if (href.indexOf(":") === -1 && href.indexOf("#") !== 0 && href.indexOf("/") !== 0) {	// protocol not specified, relative URL
		href = "#" + dir + "/" + href;
		selector.attr(attr, href);
	}
});


module.define("highlightLink", function (selector, path_array) {
	var match_path = "#";
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


module.define("loadMenu", function (top_level_dir) {
	var that = this;
    return new Promise(function (resolve, reject) {
		$.ajax({ url: "menu.html", type: "GET", cache: !that.uncache,
			success: function (data_back) {
				resolve(data_back);
			},
			error: function (xml_http_request, text_status) {
				reject(text_status);
			}
		});
	}).then(function (content) {
		$("#menu_container").append(content);
	}).then(null, function (error) {
		$("#menu_container").append("<span>no menu defined - copy menu.html.template to menu.html and edit to set up menu</span>");
	});
});


module.define("applyViz", function (elmt, dir) {
	var text = $(elmt).text().replace("{", "{" +
	    " graph [ penwidth=0.5, bgcolor=transparent ]; " +
		" node  [ fontname=Arial, fontsize=10, shape=box, style=rounded ]; " +
		" edge  [ fontname=Arial, fontsize=10 ]; ");

	text = text.replace(/[“”]/g, "\"");			// marked replaces plain double-quotes with fancy ones...
	text = text.replace(/URL="(.*)"/g, "URL=\"#" + dir + "/$1\"");
	this.debug("applyViz(): " + text);
	$(elmt).html(Viz(text, "svg"));
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
		this.addBreadcrumb(elmt, "#" + concat_path, path_array[i]);
		// elmt = this.addUL(elmt);
		// elmt = this.addBulletLink(elmt, "#" + concat_path + "README.md", path_array[i]);
	}
	elmt.append("<li class='active'>" + page + "</li>");
	// this.addBreadcrumb(elmt, "#" + concat_path + page, page, true);
	// elmt = this.addUL(elmt);
	// elmt = this.addBulletLink(elmt, "#" + concat_path + page, page);

	$(document).attr("title", title);
//    			document.title = page;

	$("#menu_container .active").removeClass("active");
	$("#menu_container").find("#" + path_array[0]).addClass("active");
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


module.define("getDocFromLocal", function (path_array) {
	var that = this,
		path = this.getFullPath(path_array);

	return x.Store.getDoc("dox", path)
		.then(function (doc_obj) {
			return doc_obj.payload.content;
		});
});


// Return a Promise; options MUST contain url and type
module.define("getDocFromServer", function (options) {
	var that = this;
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
    var regex1 = /\]\(([\w\.\/]+)\)/g,         // replace(regex, callback) doesn't seem to support capturing groups
    	regex2 = /URL\s*=\s*\"([\w\.\/]+)\"/g,
        links = [],
        that  = this,
        matches,
        i;

    function addLink(match) {
    	// TODO - need to validate that url is in the same domain
    	if (match && match.length > 1 && match[1]) {
	        links.push(match[1]);
    	}

    }
    matches = content.match(regex1);
    for (i = 0; matches && i < matches.length; i += 1) {
    	addLink(regex1.exec(matches[i]));
    	regex1.exec("");		// every other call to regex.exec() returns null for some reason...!
    }
    matches = content.match(regex2);
    for (i = 0; matches && i < matches.length; i += 1) {
    	addLink(regex2.exec(matches[i]));
    	regex2.exec("");		// every other call to regex.exec() returns null for some reason...!
    }
    return links;
});


module.define("replicateRepoIfModified", function (repo) {
	var that = this,
		new_commit_hash,
		old_commit_hash;

	this.debug("starting replicateRepoIfModified()");
	return this.getDocFromServer({ url: "../" + repo + "/.git/HEAD", type: "GET", cache: false })
	.then(function (content) {
		var ref;
		if (content) {
			ref = content.match(/ref: (.*)/);
		}
		if (!ref || ref.length < 2 || !ref[1]) {
			throw "No ref found: " + content + ", for repo " + repo;
		}
		return that.getDocFromServer({ url: "../" + repo + "/.git/" + ref[1], type: "GET", cache: false });
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
			return that.replicateRepo(repo, new_commit_hash);
		}
	});
});


module.define("replicateRepo", function (repo, commit_hash) {
	var that = this;
	this.debug("starting replicateRepo()");
	this.repl_links = {};
	this.replication_count = 0;
	this.getDocFromServerAndProcess([ repo ])
	.then(function () {
		return x.Store.getDoc("dox", repo + "/README.md");
	})
	.then(function (doc_obj) {
		doc_obj.commit_hash = commit_hash;
		return x.Store.storeDoc("dox", doc_obj);
	})
	.then(function () {
		that.debug("finished replicateRepo()");
	})
	.then(null, function (error) {
		that.error("Error in replicateRepo(): " + error);
	});
});


module.define("getDocFromServerAndProcess", function (path_array) {
	var that = this,
		path = that.getFullPath(path_array);
	// if (this.replication_count > 20) {
	// 	return;
	// }
	this.replication_count += 1;
	return this.getDocFromServer({ url: "../" + path, type: "GET", cache: false })
	.then(function (content) {
		// TODO need to check that file is markdown, or skip
		// that.info("getDocFromServerAndProcess() storing doc: " + path);
		return that.processRetrievedDoc(path_array, content);
	})
	.then(function () {
		that.info("getDocFromServerAndProcess() stored doc: " + path);
	})
	.then(null, function (error) {
		that.error("getDocFromServerAndProcess(): " + error);
	})
	.then(function () {
		return that.nextDocToReplicate();
	});
});


module.define("wait", function (millis) {
    return new Promise(function (resolve, reject) {
    	setTimeout(function () {
    		resolve();
    	},
    	millis);
    });
});


module.define("processRetrievedDoc", function (path_array, content) {
	var that  = this,
		path  = this.getFullPath(path_array),
		title = this.getDocTitle(path_array, content),
		links = this.getDocLinks(content);

	this.info("processRetrievedDoc(): doc title: " + title + ", links: " + links);
	this.addKnownLinks(links, path_array);

	return x.Store.storeDoc("dox", {
		uuid    : path,
		payload : {
			title   : title,
			links   : links,
			content : content
		}
	});
});



module.define("addKnownLinks", function (links, path_array) {
	var dir = this.getFullDirectory(path_array) + "/",
		i,
		link;

	for (i = 0; i < links.length; i += 1) {
		link = this.getFullPath(this.getPathArray(dir + links[i]));
		if (typeof this.repl_links[link] !== "boolean") {
			this.repl_links[link] = false;
		}
	}
});


module.define("nextDocToReplicate", function () {
	var links = Object.keys(this.repl_links),
		i;

	for (i = 0; i < links.length; i += 1) {
		if (!this.repl_links[links[i]]) {
			this.repl_links[links[i]] = true;			// this one done
			return this.getDocFromServerAndProcess(this.getPathArray(links[i]));
		}
	}
});







module.define("searchSetup", function (selector) {
	var that = this;
	this.debug("searchSetup(): " + selector);
	$(selector).on("change", function (event) {
		var search_str = $(this).val();
		if (!search_str) {
			return;
		}
		if (search_str.length < 4) {
			alert("search string should be at least 4 characters");
			return;
		}
		that.runSearch(search_str);
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
	$("#main_pane").append("<h1>Matches for '" + search_str + "'</h1>")
	$("#left_pane"    ).addClass("hide");
	$("#curr_location").addClass("hide");
});


module.define("displaySearchResults", function (docs, search_str) {
	var that = this,
		root_selector = $("#main_pane"),
		regex1 = new RegExp(".*" + search_str + ".*", "gi"),			// danger? for the mo, treat query as a regex expr...;
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

$(document).on("click", "div.match_result", function (event) {
	var doc_id = $(this).children("span").text(),
		uri = URI(window.location.href);

	uri.fragment(doc_id);
	window.location.href = uri.toString();
});


$(document).on("submit", function (event) {
    event.preventDefault();
	return false;
});


$(document).ready(function() {
	if (x.Reader.caching) {
		$("#caching").addClass("active");
	}
	$("#caching").text("Caching " + (x.Reader.caching ? "ON" : "OFF"));
});


$(document).on("click", "#caching", function (event) {
	x.Reader.caching = $(this).hasClass("active");
	$(this).text("Caching " + (x.Reader.caching ? "ON" : "OFF"));
	x.Reader.clearCache();
});


module.define("clearCache", function (params) {
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



$(document).on("click", "#broken_links", function (event) {
	x.Reader.brokenLinks();
});


module.define("brokenLinks", function (params) {
	var that = this,
		elem = $("#main_pane"),
		found_docs = {};

	elem.empty();
	elem.append("<table class='table'><thead><tr><th>Path / Title</th><th>Info</th><th>Links</th></tr></thead><tbody/></table>");
	elem = elem.find("table > tbody");


	function addDoc(doc) {
		var html = "<tr><td>" + doc.uuid,
			dir  = that.getFullDirectory(that.getPathArray(doc.uuid)) + "/";

		html += (doc.payload ? "<br/>" + doc.payload.title : "");
		html += "</td><td>" + doc.last_upd + "</td><td>";
		if (doc.payload && doc.payload.links) {
			html += "<ul>";
			doc.payload.links.forEach(function (link) {
				html += "<li class='missing'>" + that.getFullPath(that.getPathArray(dir + link)) + "</li>";
			});
			html += "</ul>";
		}
		html += "</td></tr>";
		elem.append(html);
		found_docs[doc.uuid] = true;
	}


	x.Store.getAllDocs("dox")
	.then(function (docs) {
		that.debug("brokenLinks() starting to process docs: " + docs.length);
		docs.forEach(function (doc) {
			addDoc(doc);
		});
		elem.find("li.missing").each(function () {
			if (found_docs[$(this).text()]) {
				$(this).removeClass("missing");
			}
		});
		that.debug("brokenLinks() ending");
	})
	.then(null, function (error) {
		that.error(error.toString());
	});
});
