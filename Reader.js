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
		all_links	: [],
		replicate   : true
    });

x.Reader = module;

module.define("start", function () {
	var that = this,
		path_array = this.getPathArray(this.queryParams().path),
		parent_path = [];

	if (path_array.length === 0 || (path_array.length === 1 && path_array[0] === "")) {
		path_array = [ this.default_repo ];
	}
	if (path_array.length > 1) {
		parent_path = path_array.slice(0, path_array.length - 1);
	}

	if (path_array.length > 0) {
		this.getDoc(path_array)
			.then(function (content) {
				that.convertAndDisplay("#main_pane"  , path_array, content);
				that.setCurrLocation("#curr_location", path_array, content);
			})
			.then(null, function (error) {
				$("#main_pane").html(error + " :-(");
			})
			.then(function () {
				if (parent_path.length > 0) {
					return that.getDoc(parent_path);
				} else {
					return "";
				}
			})
			.then(null, function (error) {
				$("#left_pane").html(error + " :-(");
			})
			.then(function (content) {
				if (content) {
					that.convertAndDisplay("#left_pane" , parent_path, content);
					that.highlightLink("#left_pane", path_array);
				} else {
					$("#left_pane").empty();
				}
			})
			.then(function () {
				that.loadMenu(path_array[0]);
				that.startReplication();
			});
	} else {
		alert("URL parameters 'repo' and 'page' expected!");
	}
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


module.define("queryParams", function () {
    return this.splitParams(location.search.substring(1));
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
		var href = $(this).attr("href");
		if (href.indexOf(":") === -1 && href.indexOf("/") !== 0) {	// protocol not specified, relative URL
			$(this).attr("href", "?path=" + dir + "/" + href);
		}
	});

	$(selector).find("img[src]").each(function () {
		var src = $(this).attr("src");
		if (src.indexOf(":") === -1 && src.indexOf("/") !== 0) {	// protocol not specified, relative URL
			$(this).attr("src", "../" + dir + "/" + src);
		}
	});

	$(selector).find("p").each(function () {
		if ($(this).text().indexOf("digraph") === 0) {
			that.applyViz(this, dir);
		}
	})
});


module.define("highlightLink", function (selector, path_array) {
	var match_path = "?path=";
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
	$.ajax({ url: "menu.html", type: "GET",
		success: function (data_back) {
			$("#menu_container").append(data_back);
			$("#menu_container").find("#" + top_level_dir).addClass("active");
		},
		error: function (xml_http_request, text_status) {
			$("#menu_container").append("<span>no menu defined - copy menu.html.template to menu.html and edit to set up menu</span>");
		}
	});
});


module.define("applyViz", function (elmt, dir) {
	var text = $(elmt).text().replace("{", "{" +
	    " graph [ penwidth=0.5, bgcolor=transparent ]; " +
		" node  [ fontname=Arial, fontsize=10, shape=box, style=rounded ]; " +
		" edge  [ fontname=Arial, fontsize=10 ]; ");

	text = text.replace(/[“”]/g, "\"");			// marked replaces plain double-quotes with fancy ones...
	text = text.replace(/URL="(.*)"/g, "URL=\"?path=" + dir + "/$1\"");
	this.debug("applyViz(): " + text);
	$(elmt).html(Viz(text, "svg"));
});


module.define("setCurrLocation", function (selector, path_array, content) {
	var i,
		elmt = $(selector),
		title = this.getDocTitle(path_array, content),
		concat_path = "",
		page = path_array[path_array.length - 1];

	for (i = 0; i < path_array.length - 1; i += 1) {
		concat_path += path_array[i] + "/";
		this.addBreadcrumb(elmt, "?path=" + concat_path, path_array[i]);
		// elmt = this.addUL(elmt);
		// elmt = this.addBulletLink(elmt, "?path=" + concat_path + "README.md", path_array[i]);
	}
	elmt.append("<li class='active'>" + page + "</li>");
	// this.addBreadcrumb(elmt, "?path=" + concat_path + page, page, true);
	// elmt = this.addUL(elmt);
	// elmt = this.addBulletLink(elmt, "?path=" + concat_path + page, page);

	$(document).attr("title", title);
//    			document.title = page;
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



// Return a Promise
module.define("getDoc", function (path_array) {
	var that = this;
    return new Promise(function (resolve, reject) {
		$.ajax({ url: "../" + that.getFullPath(path_array), type: "GET", cache: false,
			success: function (content) {
				resolve(content);
			},
			error: function (xml_http_request, text_status) {
				reject("[" + xml_http_request.status + "] " + xml_http_request.statusText + " " + text_status);
			}
		});
	}).then(function (content) {
		// TODO need to check that file is markdown, or skip
		that.processRetrievedDoc(path_array, content);
		return content;
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

	this.info("processRetrievedDoc(): doc title: " + title);
	this.info("processRetrievedDoc(): doc links: " + links);

	this.addKnownLinks(links, path_array);

	return x.Store.storeDoc("dox", {
		uuid    : path,
		payload : {
			title   : title,
			links   : links,
			content : content
		}
	}).then(function () {
		return content;
	})
	.then(null, function (error) {
		that.error(error.toString());
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
    var regex = /\]\([\w\.\/]+\)/g,         // replace(regex, callback) doesn't seem to support capturing groups
        links = [];

    content.replace(regex, function (match) {
    	var url = match.substr(2, match.length - 3);
    	// TODO - need to validate that url is in the same domain
    	if (typeof url === "string" && url) {
	        links.push(url);
    	}
    });
    return links;
});


module.define("addKnownLinks", function (links, path_array) {
	var dir = this.getFullDirectory(path_array) + "/",
		i,
		link;

	for (i = 0; i < links.length; i += 1) {
		link = this.getFullPath(this.getPathArray(dir + links[i]));
		if (this.all_links.indexOf(link) === -1) {
			this.all_links.push(link);
		}
	}
});


module.define("startReplication", function () {
	this.getUnstoredDoc(0);
});


module.define("getUnstoredDoc", function (i) {
	var that = this;
	if (!this.replicate) {
		return;
	}
	if (i + 1 >= this.all_links.length) {
		return this.getOldestDoc();
	}
	this.info("getting unstored doc " + i + ", " + this.all_links[i]);
	this.getDoc(this.getPathArray(this.all_links[i]))
		.then(null, function (error) {
			that.error(error.toString());
		})
		.then(function () {
			return that.wait(5000);
		})
		.then(function () {
			return that.getUnstoredDoc(i + 1);
		})
		.then(null, function (error) {
			that.error(error.toString());
		});
});


module.define("getOldestDoc", function () {
	this.info("getOldestDoc()");
	// TODO - find oldest doc and get a new copy, wait, and then do it again
});



module.define("searchSetup", function (selector) {
	var that = this;
	this.debug("searchSetup(): " + selector);
    $(selector).typeahead({
        minLength: 4,        // min chars typed to trigger typeahead
        items    : 20,
        source : function (query, process) { return that.searchSource (query, process); },
        updater: function (item) { return that.searchUpdater(item); }
    });
});


// use query <string> to make an array of match results and then call process(results)
module.define("searchSource", function (query, process) {
	var that = this,
		regex = new RegExp(".*" + query + ".*", "gi");			// danger? for the mo, treat query as a regex expr...

	this.debug("searchSource(): " + query);
	this.search_map = {};			// map search result <string>s to doc paths
	x.Store.getAllDocs("dox")
		.then(function (docs) {
			var results   = [],
				i;

			that.debug("searchSource() starting to match docs: " + docs.length);
			function addMatch(match_text, index) {
				results.push(match_text);
				that.search_map[match_text] = docs[index].uuid;
			}
			for (i = 0; i < docs.length; i += 1) {
				if (docs[i].payload && regex.exec(docs[i].payload.title)) {
					addMatch(docs[i].payload.title, i);
				}
			}
			for (i = 0; i < docs.length; i += 1) {
				if (docs[i].payload && typeof docs[i].payload.content === "string") {
					docs[i].payload.content.replace(regex, function (match) {
						addMatch(docs[i].payload.title + ": " + match, i);
					});
				}
			}
			that.debug("searchSource() sending results: " + results.length);
			process(results);
		})
		.then(null, function (error) {
			that.error(error.toString());
		});
});

// do something when item <string> is selected in the typeahead
module.define("searchUpdater", function (item) {
	this.info("searchUpdater(): " + item + " maps to: " + this.search_map[item]);
	window.location = "?path=" + this.search_map[item];
});
