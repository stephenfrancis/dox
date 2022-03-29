import StoredObject from "./StoredObject";

export default interface Store {
  delete(id: string): Promise<string>;

  deleteAll(): Promise<void>;

  get(id: string): Promise<StoredObject>;

  getAll(): Promise<Array<StoredObject>>;

  save(obj: StoredObject): Promise<StoredObject>;
}
