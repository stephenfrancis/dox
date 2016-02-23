/*jslint browser: true */
/*global x, indexedDB, UUID, Promise, console */


var module = x.Base.clone({
        id          : "Store",
        db_name     : "FastDox",
        store_name  : "dox",
        root_doc_id : "root"
    });

x.Store = module;


module.define("start", function () {
    var that = this;
    return this.rebuildStore()
        .then(function () {
            return that.getDoc(that.store_name, that.root_doc_id);
        })
        .then(function (doc_obj) {
            that.root_doc = doc_obj;
            that.debug("start() done");
        })
        .then(null, /* catch */ function (reason) {
            that.warn("start() failed: " + reason);
            that.root_doc = { uuid: that.root_doc_id, payload: { title: "Everything", type: "folder" } };
            that.debug("start() creating new root doc...");
            return that.storeDoc(that.store_name, that.root_doc);
        });
});


module.define("rebuildStore", function () {
    var that = this;

    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(that.db_name, 14);

        request.onupgradeneeded = function (event) {
          // The database did not previously exist, so create object stores and indexes.
            var db = request.result,
                store;

            try {
                db.deleteObjectStore(that.store_name);
            } catch (e) {
                console.log("error trying to delete object store 'dox': " + e.toString());
            }
            store = db.createObjectStore(that.store_name, { keyPath: "uuid" });
            store.createIndex("by_title", "payload.title", { unique: true });
            store.createIndex("by_parent", [ "payload.parent_id", "payload.sequence_nbr" ], { unique: false });
            store.createIndex("by_last_upd", [ "last_upd" ], { unique: false });
        };

        request.onsuccess = function () {
            that.db = request.result;
            resolve();
        };

        request.onerror = function (error) {
            reject(error.toString() || "no error supplied in onupgradeneeded");
        };
    });
});

// doc_obj MUST have the form:
// uuid: <string>, payload: { title: <string>, ...}
// payload may also have parent_id: <uuid>, sequence_nbr: <number>
// last_upd is automatically set on doc_obj
module.define("storeDoc", function (store_id, doc_obj) {
    var that = this;
    if (typeof doc_obj.uuid !== "string" || !doc_obj.uuid) {
        throw new Error("doc must have a non-blank string uuid");
    }
    if (typeof doc_obj.payload !== "object" || typeof doc_obj.payload.title !== "string") {
        throw new Error("doc must have a payload object containing a string title");
    }

    doc_obj.last_upd = (new Date()).toISOString();

    return new Promise(function (resolve, reject) {
        var tx = that.db.transaction(store_id, "readwrite"),
            store = tx.objectStore(store_id);

        store.put(doc_obj);
        tx.oncomplete = function () {
            resolve(doc_obj);
        };
        tx.onerror = function (event) {
            reject("error in storeDoc(" + store_id + ", " + doc_obj.uuid + "): " + (tx.error + ", " + JSON.stringify(event)));
        };
    });
});


module.define("getDoc", function (store_id, uuid) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var tx = that.db.transaction(store_id, "readonly"),
            store = tx.objectStore(store_id),
            request = store.get(uuid);

        that.debug("creating getDoc() promise");
        request.onsuccess = function () {
            var doc_obj = request.result;
            if (doc_obj === undefined) {
                that.error("calling getDoc() reject with: doc not found: " + uuid);
                reject("doc not found: " + uuid);
            } else {
                that.debug("calling getDoc() resolve with: " + uuid);
                resolve(doc_obj);
            }
        };
        request.onerror = function () {
            that.error("calling getDoc() reject with: " + tx.error);
            reject(tx.error || "no error supplied in getDoc");
        };
    });
});


module.define("getAllDocs", function (store_id) {
    var that = this,
        results = [];

    return new Promise(function (resolve, reject) {
        var tx = that.db.transaction(store_id, "readonly"),
            store = tx.objectStore(store_id),
            request = store.openCursor();

        request.onsuccess = function () {
            var cursor = request.result;
            if (cursor) {
                // Called for each matching record.
                results.push(cursor.value);
                cursor["continue"]();
            } else {
                resolve(results);
            }
        };
        request.onerror = function () {
            reject(tx.error || "no error supplied in getAllDocs");
        };
    });
});


/*
module.define("getChildDocIds", function (store_id, uuid) {
    var that = this,
        results = [];

    return new Promise(function (resolve, reject) {
        var tx = that.db.transaction(store_id, "readonly"),
            store = tx.objectStore(store_id),
//            request = store.openCursor();
            range = IDBKeyRange.bound([ uuid, 0 ], [ uuid, 99999 ]),
            request = store.index("by_parent").openCursor(range);

        request.onsuccess = function () {
            var cursor = request.result;
            if (cursor) {
                that.debug("result: " + cursor.key + ", " + cursor.value.uuid);
                // Called for each matching record.
//                if (cursor.value && cursor.value.payload.parent_id === uuid) {
                results.push(cursor.value);
//                }
                cursor["continue"]();
            } else {
                resolve(results);
            }
        };
        request.onerror = function () {
            reject(tx.error);
        };
    });
};
*/


module.define("deleteDoc", function (store_id, doc_obj) {
//    var that = this;

    return new Promise(function (resolve, reject) {
        var tx = this.db.transaction(store_id, "readwrite"),
            store = tx.objectStore(store_id);
/*
        store["delete"](doc_obj.uuid);
        request.onsuccess = function () {
            resolve(doc_obj);
        };
        request.onerror = function () {
            reject(tx.error);
        };
*/
    });
});


module.define("setDocParent", function (node_id, parent_id, position) {
    var that = this,
        old_parent_id;

    that.debug("setDocParent(): setting node: " + node_id + " parent to: " + parent_id);
// ARE using children!
    that.getDoc(that.store_name, node_id)
        .then(function (doc_obj) {
            that.debug("setDocParent().then(1): update doc");
            old_parent_id = doc_obj.payload.parent_id;
            doc_obj.payload.parent_id    = parent_id;
    //        doc_obj.payload.sequence_nbr = sequence_nbr;
            return that.storeDoc(that.store_name, doc_obj);
        })
        .then(function () {
            that.debug("setDocParent().then(2): get new parent document: " + parent_id);
            if (!parent_id) {
                throw new Error("no new parent_id");
            }
            return that.getDoc(that.store_name, parent_id);
        })
        .then(function (doc_obj) {
            that.debug("setDocParent().then(3): update new parent doc: " + doc_obj.uuid);
            if (!doc_obj.payload.children) {
                doc_obj.payload.children = [];
            }
            if (doc_obj.payload.children.indexOf(node_id) > -1) {
                doc_obj.payload.children.splice(doc_obj.payload.children.indexOf(node_id), 1);
            }
            if (typeof position !== "number" || position < 0 || position > doc_obj.payload.children.length) {
                position = doc_obj.payload.children.length;
            }
        //     if (typeof position !== "number" || position < 0) {
        //         position = 0;
        //     }

            that.debug("setDocParent(): about to splice, to position: " + position + ", array initial length: " +
                doc_obj.payload.children.length + ", node_id: " + node_id);
            doc_obj.payload.children.splice(position, 0, node_id);
            return that.storeDoc(that.store_name, doc_obj);
        })
        .then(null, /* catch */ function (reason) {
            that.debug("setDocParent().then(4): catch reason: " + reason);
        })
        .then(function () {
            that.debug("setDocParent().then(5): get old parent doc");
            if (!old_parent_id || old_parent_id === parent_id) {
                throw new Error("no old_parent_id");
            }
            return that.getDoc(that.store_name, old_parent_id);
        })
        .then(function (doc_obj) {
            that.debug("setDocParent().then(6): update old parent doc: " + doc_obj.uuid, 4);
            if (doc_obj.payload.children.indexOf(node_id) > -1) {
                doc_obj.payload.children.splice(doc_obj.payload.children.indexOf(node_id), 1);
            }
            return that.storeDoc(that.store_name, doc_obj);
        })
        .then(function () {
            that.debug("setDocParent().then(7): all done!");
        })
        .then(null, /* catch */ function (reason) {
            that.error("setDocParent().then(8) failed: " + reason);
        });
});


module.define("parentReset", function () {
    var that = this;
    this.info("beginning parentReset()");
    return that.getAllDocs(that.store_name)
        .then(function (results) {
            var i,
                docs = {},
                doc,
                parent;

            for (i = 0; i < results.length; i += 1) {
                doc = results[i];
                docs[doc.uuid] = doc;
            }
            for (i = 0; i < results.length; i += 1) {
                doc = results[i];
                if (doc.payload.parent_id) {
                    parent = docs[doc.payload.parent_id];
                    if (!parent.payload.children) {
                        parent.payload.children = [];
                    }
                    parent.payload.children.push(doc.uuid);
                }
                if (doc.payload.type === "document") {
                    if (!doc.payload.parent_id) {
                        that.info("ERROR: doc has no parent: " + doc.uuid);
                    }
                } else {        // folder
                    delete doc.payload.content;
                }
                delete doc.payload.sequence_nbr;
                delete doc["repl status"];

            }
            for (i = 0; i < results.length; i += 1) {
                doc = results[i];
                that.info("saving: " + doc.uuid + ", children: " + doc.payload.children);
                that.storeDoc(that.store_name, doc);
            }
        })
        .then(null, /* catch */ function (reason) {
            that.error("childrenReset() failed: " + reason);
        });
});

module.define("rootReset", function () {
    var that = this;
    this.info("beginning rootReset()");
    return that.getDoc(that.store_name, that.root_doc_id)
        .then(function (doc_obj) {
            delete doc_obj.payload.parent_id;
            doc_obj.payload.children.splice(1, 1);
            that.storeDoc(that.store_name, doc_obj);
        })
        .then(null, /* catch */ function (reason) {
            that.error("rootReset() failed: " + reason);
        });
});
