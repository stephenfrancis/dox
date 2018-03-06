
import * as RootLog from "loglevel";
import * as Url from "url";
import * as Path from "path";
import Doc from "./Doc";
import * as IndexedDB from "lapis/IndexedDB";
import * as IndexedDBAjaxStore from "lapis/IndexedDBAjaxStore";

const Log = RootLog.getLogger("dox.Repo");
const idb_version = 1; // integer version sequence


export default class Repo {
  private base_url: string; // used to derive the URL of documents in the repo, being the repo_url + (if specified) branch
  private branch: string; // (optional) the published branch, added to base_url if specified
  private promise: Promise<IndexedDBAjaxStore>;
  private root_doc: Doc;
  private repo_name: string; // the derived name of the repo, from the last path element of repo_url
  private repo_url: string; // full URL of the hosted Git repo, the last path element being the repo name


  constructor (repo_url: string, branch?: string) {
    this.repo_url = repo_url;
    this.branch = branch;
    this.validateProps();
    this.root_doc = new Doc(this, "/", null);
    this.setupStore();
    Log.debug(`Repo created: ${this.base_url}`);
  }


  public getBaseURL(): string {
    return this.base_url;
  }


  public getDoc(path: string) {
    const array = path.split("/");
    let doc = this.root_doc;
    let i = 0;
    while (i < array.length) {
      if (array[i]) {
        doc = (doc.getChildDoc(array[i]) || doc.createChildDoc(array[i]));
        i += 1;
      } else {
        array.splice(i, 1);
      }
    }
    return doc;
  }


  public getHash(): string {
    var new_url = "#repo_url=" + this.repo_url;
    if (this.branch) {
      new_url += "&branch=" + this.branch;
    }
    return new_url;
  }


  public getPromise(): Promise<IndexedDBAjaxStore> {
    return this.promise;
  }


  public getRepoName(): string {
    return this.repo_name;
  }


  public isSameRepo(repo_url: string, branch?: string) {
    return (repo_url === this.repo_url && branch === this.branch);
  }


  private setupStore() {
    const base_url = this.getBaseURL();
    const database = new IndexedDB(window.indexedDB, "dox", idb_version);
    const store = new IndexedDBAjaxStore(database, base_url,
      { keyPath: "uuid", },
      [
        {
          id: "by_title",
          key_path: "payload.title",
          additional: { unique: false, },
        },
      ], base_url);

    this.promise = database.start()
      .then(function () {
        return store;
      });
  }


  private validateProps() {
    if (!this.repo_url) {
      throw new Error("'repo_url' must be defined");
    }
    // strip any trailing slash
    if (this.repo_url.substr(-1) === "/") {
      this.repo_url = this.repo_url.substr(0, (this.repo_url.length - 1));
    }
    this.base_url = this.repo_url + "/"; // append trailing slash!
    if (this.branch) {
      this.base_url += this.branch + "/";
    }
    this.repo_name = this.repo_url.substr(this.repo_url.lastIndexOf("/") + 1);
  }

}
