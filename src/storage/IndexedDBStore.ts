import Debug from "debug";
import Store from "./Store";
import StoredObject from "./StoredObject";

const debug = Debug("storage/IndexedDBStore");

export default class IndexedDBStore implements Store {
  private constructor_funct: { new (arg: Object): Object };
  private create_properties: any;
  private db: any;
  private first_version: number;
  private indexes: Array<any>;
  private store_id: string;
  private upgrade_functions: Array<Function>;

  constructor(store_id: string, create_properties: any, indexes: Array<any>) {
    this.store_id = store_id; // string store name
    this.create_properties = create_properties || { keyPath: "id" }; // object including key path, etc
    this.indexes = indexes || []; // array declaring indexes
    this.upgrade_functions = [];
    this.upgrade_functions[0] = function (db, request) {
      this.createStore(db);
    };
    this.first_version = 1;
  }
  // pre-start

  public setConstructor(constructor_funct) {
    var obj = new constructor_funct({ id: 1 }); // test the constructor!
    if (typeof obj.pushObjectToStore === "function") {
      debug("%s implements pushObjectToStore()", constructor_funct.name);
    }
    if (typeof obj.pullObjectFromStore === "function") {
      debug("%s implements pullObjectFromStore()", constructor_funct.name);
    }
    this.constructor_funct = constructor_funct;
  }

  // start

  createStore(db) {
    var store;
    var i;
    this.throwIfStarted();
    store = db.createObjectStore(this.store_id, this.create_properties);
    debug("created store");
    for (i = 0; this.indexes && i < this.indexes.length; i += 1) {
      store.createIndex(
        this.indexes[i].id,
        this.indexes[i].key_path,
        this.indexes[i].additional
      );
      debug(
        "created index: %s with key_path: %s",
        this.indexes[i].id,
        this.indexes[i].key_path
      );
    }
  }

  deleteStore(db) {
    db.deleteObjectStore(this.store_id);
  }

  setUpgradeFunction(
    from_version: number,
    to_version: number,
    funct: Function
  ) {
    if (
      typeof from_version !== "number" ||
      from_version < 1 ||
      !Number.isInteger(from_version)
    ) {
      throw new Error("from_version must be an integer >= 1: " + from_version);
    }
    if (to_version !== from_version + 1) {
      throw new Error("to_version must be from_version + 1: " + to_version);
    }
    if (this.upgrade_functions[from_version]) {
      throw new Error(
        "upgrade function already set for this store for version: " +
          from_version
      );
    }
    if (typeof funct !== "function") {
      throw new Error("3rd arg must be a function");
    }
    this.upgrade_functions[from_version] = funct;
  }

  upgrade(from_version: number, to_version: number, db, request) {
    var i;
    for (i = from_version; i < to_version; i += 1) {
      if (this.upgrade_functions[i]) {
        debug(
          "calling upgrade function for store: " +
            this.store_id +
            ", from_version: " +
            i
        );
        this.upgrade_functions[i].call(this, db, request);
      }
    }
  }

  start(db): void {
    this.throwIfStarted();
    this.db = db;
  }

  public isStarted(): boolean {
    return !!this.db;
  }

  throwIfStarted() {
    if (this.isStarted()) {
      throw new Error("this Store is already started");
    }
  }

  throwIfNotStarted() {
    if (!this.isStarted()) {
      throw new Error("this Store is not started yet");
    }
  }

  // post-start

  public save(obj: any): Promise<StoredObject> {
    var that = this;
    this.throwIfNotStarted();
    if (typeof obj.pushObjectToStore === "function") {
      obj = obj.pushObjectToStore();
    }

    return new Promise(function (resolve, reject) {
      var tx = that.db.transaction(that.store_id, "readwrite");
      var store = tx.objectStore(that.store_id);

      store.put(obj);
      tx.oncomplete = function () {
        debug("doc saved: %s", obj[that.create_properties.keyPath]);
        resolve(obj);
      };
      tx.onerror = function () {
        debug("Store.save() error: %o", tx.error);
        reject(tx.error);
      };
    });
  }

  public get(id: string): Promise<StoredObject> {
    var that = this;
    this.throwIfNotStarted();

    return new Promise(function (resolve, reject) {
      var tx = that.db.transaction(that.store_id, "readonly");
      var store = tx.objectStore(that.store_id);
      var request = store.get(id);

      request.onsuccess = function () {
        var obj = request.result;
        if (obj === undefined) {
          debug("object not found: %s", id);
          reject("object not found: " + id);
        } else {
          if (that.constructor_funct) {
            obj = new that.constructor_funct(obj);
            if (typeof obj.pullObjectFromStore === "function") {
              obj.pullObjectFromStore();
            }
          }
          debug("object loaded: %s", id);
          resolve(obj);
        }
      };
      request.onerror = function () {
        debug(tx.error);
        reject(tx.error);
      };
    });
  }

  public delete(id: string): Promise<string> {
    var that = this;
    this.throwIfNotStarted();

    return new Promise(function (resolve, reject) {
      var tx = that.db.transaction(that.store_id, "readwrite");
      var store = tx.objectStore(that.store_id);
      var request = store.delete(id);

      request.onsuccess = function () {
        // debug("object deleted: %s", id);
        resolve(id);
      };
      request.onerror = function () {
        debug(tx.error);
        reject(tx.error);
      };
    });
  }

  public getAll(): Promise<Array<StoredObject>> {
    var that = this;
    var results = [];
    this.throwIfNotStarted();

    return new Promise(function (resolve, reject) {
      var tx = that.db.transaction(that.store_id, "readonly");
      var store = tx.objectStore(that.store_id);
      var request = store.openCursor();

      request.onsuccess = function () {
        var cursor = request.result;
        debug("Store.getAll() onsuccess; cursor? " + cursor);
        if (cursor) {
          // Called for each matching record.
          results.push(cursor.value);
          cursor.continue();
        } else {
          debug("getAll() %d results", results.length);
          if (that.constructor_funct) {
            results.forEach(function (obj, i) {
              results[i] = new that.constructor_funct(obj);
            });
          }
          resolve(results);
        }
      };
      request.onerror = function () {
        debug(tx.error);
        reject(tx.error);
      };
    });
  }

  public deleteAll(): Promise<void> {
    var that = this;
    this.throwIfNotStarted();

    return new Promise(function (resolve, reject) {
      var tx = that.db.transaction(that.store_id, "readwrite");
      var store = tx.objectStore(that.store_id);
      var request = store.clear();

      request.onsuccess = function () {
        // debug("deleteAll() succeeded");
        resolve();
      };
      request.onerror = function () {
        debug(tx.error);
        reject(tx.error);
      };
    });
  }
}
