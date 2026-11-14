// Thin, reusable wrapper around AsyncStorage.
// All values are stored as JSON. Errors are caught so a storage problem never crashes a screen.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used before accounts existed (all data shared on the phone).
// Kept so that data can be moved into the first account (see dataService.migrateSharedData).
export const STORAGE_KEYS = {
  SCHEMA_VERSION: '@buildtrack/schemaVersion',
  ACTIVE_PROJECT_ID: '@buildtrack/activeProjectId',
  PROJECTS: '@buildtrack/projects',
  PHASES: '@buildtrack/phases',
  MATERIALS: '@buildtrack/materials',
  EQUIPMENT: '@buildtrack/equipment',
  MANPOWER: '@buildtrack/manpower',
  EXPENSES: '@buildtrack/expenses',
  PRICES: '@buildtrack/prices', // price database (all projects)
  WAGES: '@buildtrack/wageReferences', // government wage references (all projects)
};

/** The same keys, but private to one account: "@buildtrack/u/<userId>/projects", … */
export function userStorageKeys(userId) {
  if (!userId) throw new Error('No account is logged in.');
  return Object.fromEntries(Object.entries(STORAGE_KEYS).map(([name, key]) => [name, key.replace('@buildtrack/', `@buildtrack/u/${userId}/`)]));
}

// Accounts (shared by the whole phone).
export const AUTH_KEYS = {
  USERS: '@buildtrack/auth/users', // [{ id, username, salt, passwordHash, createdAt, biometricEnabled, biometricAsked }]
  LAST_USER_ID: '@buildtrack/auth/lastUserId', // who logged in last (for fingerprint unlock)
};

// Keys from removed features (Nearby Stores / Where to Buy). Deleted on the next app start.
export const LEGACY_KEYS = ['@buildtrack/stores', '@buildtrack/searchOrigin'];

/** Save any JSON-serializable value. Returns true on success. */
export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to save "${key}"`, error);
    return false;
  }
}

/** Load a value. Returns `fallback` if nothing is saved or the data is unreadable. */
export async function loadData(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Failed to load "${key}"`, error);
    return fallback;
  }
}

/** Load, change with `updater(current)`, then save. Returns the new value. */
export async function updateData(key, updater, fallback = null) {
  const current = await loadData(key, fallback);
  const next = updater(current);
  await saveData(key, next);
  return next;
}

/** Remove one key. */
export async function deleteData(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to delete "${key}"`, error);
    return false;
  }
}

/** Save several keys at once: saveMany({ [KEY]: value, ... }) */
export async function saveMany(entries) {
  try {
    const pairs = Object.entries(entries).map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs);
    return true;
  } catch (error) {
    console.warn('[storage] Failed to save multiple keys', error);
    return false;
  }
}

/** Load several keys at once. Returns { [key]: value | null } */
export async function loadMany(keys) {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(
      pairs.map(([key, raw]) => {
        try {
          return [key, raw == null ? null : JSON.parse(raw)];
        } catch {
          return [key, null];
        }
      }),
    );
  } catch (error) {
    console.warn('[storage] Failed to load multiple keys', error);
    return Object.fromEntries(keys.map((key) => [key, null]));
  }
}

/** Remove several keys at once (ignores keys that don't exist). */
export async function deleteMany(keys) {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.warn('[storage] Failed to delete multiple keys', error);
    return false;
  }
}

/** Remove everything one account has saved (its projects, prices, wages…). Accounts themselves are kept. */
export async function clearAppData(userId) {
  try {
    await AsyncStorage.multiRemove([...Object.values(userStorageKeys(userId)), ...LEGACY_KEYS]);
    return true;
  } catch (error) {
    console.warn('[storage] Failed to clear app data', error);
    return false;
  }
}

// ── Collection helpers (arrays of records with an `id`) — used from Stage 2 ──

export function addItem(key, item) {
  return updateData(key, (list) => [...(list ?? []), item], []);
}

export function updateItem(key, id, changes) {
  return updateData(key, (list) => (list ?? []).map((item) => (item.id === id ? { ...item, ...changes } : item)), []);
}

export function deleteItem(key, id) {
  return updateData(key, (list) => (list ?? []).filter((item) => item.id !== id), []);
}
