import Debug from "debug";
import Store from "./Store";
import StoredObject from "./StoredObject";

const debug = Debug("storage/AjaxStore");

enum Mode {
  Both,
  Server,
  Store,
}

// call from browser: new Database({ indexedDB = window.indexedDB }, ...)
/* globals XMLHttpRequest */

export default class AjaxStore {
  private local_store: Store;
  private mode: Mode;
  private response_convert: Function;
  private server_url: string;

  constructor(local_store, server_url) {
    this.local_store = local_store;
    this.mode = Mode.Both;
    this.response_convert = function (url: string, str: string): StoredObject {
      return JSON.parse(str) as StoredObject;
    };
    this.server_url = server_url;
  }

  public getDoc(rel_path: string): Promise<StoredObject> {
    // return new Promise(function (resolve, reject) {
    //   resolve(undefined);
    // })
    //   .then(() => {
    debug(`getDoc()..1 mode: ${this.mode}, rel_path: ${rel_path}`);
    if (this.mode === Mode.Server) {
      throw new Error("force use of getDocFromServer...");
    }
    return (
      this.getDocFromStore(rel_path)
        // })
        .then((doc_obj) => {
          debug(`getDoc()..2 doc_obj: ${!!doc_obj}`);
          return doc_obj;
        })
        .catch((err) => {
          if (this.mode === Mode.Store) {
            throw err;
          }
          return this.getDocFromServer(rel_path);
        })
    );
  }

  // take path_array and return a Promise
  getDocFromStore(rel_path: string): Promise<StoredObject> {
    return this.local_store.get(rel_path);
  }

  // take path_array and return a Promise
  getDocFromServer(rel_path: string): Promise<StoredObject> {
    return this.getFileFromServer({
      url: this.server_url + rel_path,
      type: "GET",
      cache: false,
    });
  }

  // Return a Promise; options MUST contain url and type
  getFileFromServer(options: any): Promise<StoredObject> {
    const that = this;
    debug(
      `getFileFromServer() preparing to send: ${options.type}, ${options.url}`
    );
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open(options.type, options.url);
      xhr.onreadystatechange = function () {
        that.onServerMessageReceived(xhr, resolve, reject);
      };
      xhr.send();
    });
  }

  private onServerMessageReceived(xhr, resolve, reject) {
    var msg;
    debug(
      `getFileFromServer() onreadystatechange: ${xhr.readyState}, ${xhr.status}`
    );
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        debug(`getFileFromServer() successfully sent: ${xhr.responseURL}`);
        resolve(this.response_convert(xhr.responseURL, xhr.responseText));
      } else {
        reject(`unexpected status: ${xhr.status}`);
      }
    } else if (xhr.status > 399) {
      msg = `[${xhr.status}] ${xhr.statusText}`;
      debug(`getFileFromServer() failed: ${msg}`);
      reject(msg);
    }
  }

  public setModeBoth(): void {
    this.mode = Mode.Both;
  }

  public setModeServer(): void {
    this.mode = Mode.Server;
  }

  public setModeStore(): void {
    this.mode = Mode.Store;
  }

  public setResponseConverter(funct: Function): void {
    this.response_convert = funct;
  }
}
