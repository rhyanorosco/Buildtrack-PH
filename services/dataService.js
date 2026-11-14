// Loads / saves one account's data on the device, and seeds the sample project for a new account.
import { LEGACY_KEYS, STORAGE_KEYS, clearAppData, deleteMany, loadMany, saveMany, userStorageKeys } from './storage';
import { buildSampleData } from '../data/sampleProject';
import { buildSamplePrices } from '../data/samplePrices';
import { WAGE_REFERENCES } from '../data/wageReferences';

// Bump this when the saved data shape changes, so old data can be migrated or reset.
const SCHEMA_VERSION = 1;

// Which storage key (name in STORAGE_KEYS) holds each collection.
const COLLECTIONS = {
  projects: 'PROJECTS',
  phases: 'PHASES',
  materials: 'MATERIALS',
  equipment: 'EQUIPMENT',
  manpower: 'MANPOWER',
  expenses: 'EXPENSES',
  prices: 'PRICES',
  wageReferences: 'WAGES',
};

// Reference data every install starts with (labelled Sample / User-Editable).
const defaultReferenceData = () => ({ prices: buildSamplePrices(), wageReferences: WAGE_REFERENCES.map((w) => ({ ...w })) });

export const EMPTY_APP_DATA = {
  projects: [],
  phases: [],
  materials: [],
  equipment: [],
  manpower: [],
  expenses: [],
  prices: [],
  wageReferences: [],
  activeProjectId: null,
};

/** Saves one account's complete data to the device. Throws if saving fails. */
export async function saveAppData(data, userId) {
  const keys = userStorageKeys(userId);
  const entries = {
    [keys.SCHEMA_VERSION]: SCHEMA_VERSION,
    [keys.ACTIVE_PROJECT_ID]: data.activeProjectId,
  };
  Object.entries(COLLECTIONS).forEach(([name, keyName]) => {
    entries[keys[keyName]] = data[name] ?? [];
  });
  const ok = await saveMany(entries);
  if (!ok) throw new Error('Could not save data on this device.');
  return data;
}

/** Saves the built-in sample project for this account (overwrites its data). */
export async function seedSampleData(userId) {
  return saveAppData({ ...buildSampleData(), ...defaultReferenceData() }, userId);
}

/** Loads one account's data. A brand-new account gets the sample project. */
export async function loadAppData(userId) {
  const keys = userStorageKeys(userId);
  const stored = await loadMany(Object.values(keys));
  // Clean up data from removed features (saved stores, last store-search location).
  deleteMany(LEGACY_KEYS);

  const isFirstLaunch = stored[keys.SCHEMA_VERSION] == null;
  if (isFirstLaunch) return seedSampleData(userId);

  const data = { ...EMPTY_APP_DATA, activeProjectId: stored[keys.ACTIVE_PROJECT_ID] ?? null };
  Object.entries(COLLECTIONS).forEach(([name, keyName]) => {
    data[name] = Array.isArray(stored[keys[keyName]]) ? stored[keys[keyName]] : [];
  });
  // Older installs (before Stage 6) have no price database / wage references yet.
  const defaults = defaultReferenceData();
  if (!Array.isArray(stored[keys.PRICES])) data.prices = defaults.prices;
  if (!Array.isArray(stored[keys.WAGES])) data.wageReferences = defaults.wageReferences;
  return data;
}

/**
 * Moves the data saved before accounts existed into one account (used for the FIRST account only).
 * Returns true if there was old data to move.
 */
export async function migrateSharedData(userId) {
  const sharedKeys = Object.values(STORAGE_KEYS);
  const stored = await loadMany(sharedKeys);
  if (stored[STORAGE_KEYS.SCHEMA_VERSION] == null) return false; // nothing saved before accounts
  const keys = userStorageKeys(userId);
  const entries = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    if (stored[key] != null) entries[keys[name]] = stored[key];
  });
  if (!(await saveMany(entries))) throw new Error('Could not move your existing projects into the new account.');
  await deleteMany(sharedKeys);
  return true;
}

/** Wipes this account's data and restores the sample project. */
export async function resetToSampleData(userId) {
  await clearAppData(userId);
  return seedSampleData(userId);
}
