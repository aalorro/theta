import { openDB, type IDBPDatabase } from 'idb';
import type { CacheEntry } from './ttl';

const DB_NAME = 'theta-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<CacheEntry<T> | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}

export async function idbSet<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, entry, key);
}

export async function idbDelete(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, key);
}

export async function idbClear(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
