
import { GeneratedResult } from "../types";

const DB_NAME = "NFT_Generator_DB";
const STORE_NAME = "history";
const DB_VERSION = 1;

export interface HistoryItem extends GeneratedResult {
  id: string;
  timestamp: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject("Database failed to open");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const saveToHistory = async (item: GeneratedResult): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const historyItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  store.add(historyItem);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getAllHistory = async (): Promise<HistoryItem[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      // 按时间倒序排列
      const results = (request.result as HistoryItem[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
  });
};

export const deleteFromHistory = async (id: string): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const clearAllHistory = async (): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};
