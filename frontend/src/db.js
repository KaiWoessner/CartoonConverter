import { openDB } from 'idb';

const DB_NAME = 'CartoonizerDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveToIDB = async (key, value) => {
  const db = await getDB();
  await db.put(STORE_NAME, value, key);
};

export const getFromIDB = async (key) => {
  const db = await getDB();
  return db.get(STORE_NAME, key);
};