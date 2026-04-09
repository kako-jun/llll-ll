/**
 * localStorage ユーティリティ
 * すべての永続化データを "llll-ll" という単一キーの JSON オブジェクトで管理する
 */

const STORAGE_KEY = "llll-ll";

interface StorageData {
  language?: string;
  theme?: string;
  visited?: boolean;
}

function load(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StorageData;
  } catch {
    return {};
  }
}

function save(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded etc. — silently ignore
  }
}

export function getStorage<K extends keyof StorageData>(key: K): StorageData[K] {
  return load()[key];
}

export function setStorage<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
  const data = load();
  data[key] = value;
  save(data);
}
