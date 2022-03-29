import * as RootLog from "loglevel";
import * as Underscore from "underscore";
import IndexedDBStore from "./IndexedDBStore";

const Log = RootLog.getLogger("storage/IndexedDB");

// call from browser: new Database({ indexedDB = window.indexedDB }, ...)

export default class IndexedDB {
  private window_indexedDB: any;
  private db_id: string;
  private db: any;
  private version: number;
  private stores: { [key: string]: IndexedDBStore };

  constructor(window_indexedDB: any, db_id: string, version: number) {
    if (typeof version !== "number") {
      throw new Error("version number must be supplied");
    }
    this.window_indexedDB = window_indexedDB;
    this.db_id = db_id; // string database name
    this.version = version; // integer version sequence
    this.stores = {};
  }

  public addStore(
    store_id: string,
    create_properties: any,
    indexes: Array<Object>
  ): IndexedDBStore {
    this.throwIfStarted();
    if (this.stores[store_id]) {
      throw new Error("store id already in use: " + store_id);
    }
    const store: IndexedDBStore = new IndexedDBStore(
      store_id,
      create_properties,
      indexes
    );
    this.stores[store_id] = store;
    return store;
  }

  public isStarted(): boolean {
    return !!this.db;
  }

  private throwIfStarted(): void {
    if (this.isStarted()) {
      throw new Error("this Database is already started");
    }
  }

  public start() {
    const that = this;
    this.throwIfStarted();
    Log.debug(
      "opening indexedDB database: %s, version: %d",
      this.db_id,
      this.version
    );
    return new Promise(function (resolve, reject) {
      var request = that.window_indexedDB.open(that.db_id, that.version);

      request.onupgradeneeded = function (event) {
        // The database did not previously exist, so create object stores and indexes.
        Log.info("Upgrading...");
        that.db = request.result;
        that.upgrade(event.oldVersion, request);
      };

      request.onsuccess = function () {
        that.db = request.result;
        that.startStores();
        resolve(undefined);
      };

      request.onerror = function (error) {
        that.db = null;
        Log.error("Store.start() error: %o", error);
        reject(error);
      };
    });
  }

  private upgrade(old_version, request) {
    const that = this;
    Underscore.each(this.stores, function (store: IndexedDBStore) {
      store.upgrade(old_version, that.version, that.db, request);
    });
  }

  private deleteDatabase() {
    // this.throwIfStarted();
    const that = this;
    Underscore.each(this.stores, function (store: IndexedDBStore) {
      try {
        store.deleteStore(that.db);
      } catch (e) {
        Log.error(e);
      }
    });
  }

  private startStores() {
    const that = this;
    Underscore.each(this.stores, function (store: IndexedDBStore) {
      store.start(that.db);
    });
  }
}
