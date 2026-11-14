// ─────────────────────────────────────────────────────────────
// LOCAL ACCOUNTS — sign up / log in on this phone (no server, works offline).
//
// • Passwords are never saved as typed: each account stores a random "salt" and a
//   SHA-256 hash of salt + password (repeated many times), using expo-crypto.
// • Each account's projects are saved under its own storage keys (see storage.userStorageKeys).
// • The FIRST account created receives the projects that were on the phone before accounts existed.
//
// Note: this protects the app from casual access on a shared phone. It is not a bank-grade
// security system: anyone with full access to the phone's files could still read app data.
// ─────────────────────────────────────────────────────────────
import * as Crypto from 'expo-crypto';
import { AUTH_KEYS, loadData, saveData } from './storage';
import { migrateSharedData } from './dataService';
import { todayISO } from '../utils/dates';

export const AUTH_RULES = {
  usernameMin: 3,
  usernameMax: 20,
  passwordMin: 6,
  hashRounds: 500, // more rounds = slower to guess; 500 keeps login under a second on most phones
};

/** Usernames are matched without caring about capital letters: "Juan" = "juan". */
export const normalizeUsername = (text) => String(text ?? '').trim().toLowerCase();

/** Returns an error message, or '' if the username is OK. */
export function validateUsername(text) {
  const name = String(text ?? '').trim();
  if (!name) return 'Username is required.';
  if (name.length < AUTH_RULES.usernameMin || name.length > AUTH_RULES.usernameMax) {
    return `Username must be ${AUTH_RULES.usernameMin}–${AUTH_RULES.usernameMax} characters.`;
  }
  if (!/^[A-Za-z0-9._]+$/.test(name)) return 'Use only letters, numbers, dots or underscores (no spaces).';
  return '';
}

/** Returns an error message, or '' if the password is OK. */
export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < AUTH_RULES.passwordMin) return `Password must be at least ${AUTH_RULES.passwordMin} characters.`;
  return '';
}

/** salt + password → hex hash, repeated AUTH_RULES.hashRounds times. */
export async function hashPassword(password, salt, rounds = AUTH_RULES.hashRounds) {
  let hash = `${salt}:${password}`;
  for (let i = 0; i < rounds; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${hash}`);
  }
  return hash;
}

/** What screens may see about an account (never the hash or salt). */
export function publicUser(user) {
  if (!user) return null;
  const { id, username, createdAt, biometricEnabled = false, biometricAsked = false } = user;
  return { id, username, createdAt, biometricEnabled, biometricAsked };
}

export async function loadUsers() {
  const users = await loadData(AUTH_KEYS.USERS, []);
  return Array.isArray(users) ? users : [];
}

async function saveUsers(users) {
  if (!(await saveData(AUTH_KEYS.USERS, users))) throw new Error('Could not save the account on this phone.');
}

/** The account that logged in last (used for fingerprint unlock), or null. */
export async function getLastUser() {
  const id = await loadData(AUTH_KEYS.LAST_USER_ID, null);
  const users = await loadUsers();
  return publicUser(users.find((u) => u.id === id));
}

/** Creates an account and returns it. Throws with a readable message if something is wrong. */
export async function signUp(username, password, confirmPassword) {
  const problem = validateUsername(username) || validatePassword(password) || (password !== confirmPassword ? 'Passwords do not match.' : '');
  if (problem) throw new Error(problem);

  const users = await loadUsers();
  const key = normalizeUsername(username);
  if (users.some((u) => normalizeUsername(u.username) === key)) throw new Error('That username is already taken on this phone.');

  const salt = Crypto.randomUUID();
  const user = {
    id: `user-${Crypto.randomUUID()}`,
    username: username.trim(),
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: todayISO(),
    biometricEnabled: false,
    biometricAsked: false,
  };
  // The first account keeps the projects already on the phone.
  if (users.length === 0) await migrateSharedData(user.id);
  await saveUsers([...users, user]);
  await saveData(AUTH_KEYS.LAST_USER_ID, user.id);
  return publicUser(user);
}

/** Checks a username + password. Returns the account, or throws "Wrong username or password." */
export async function logIn(username, password) {
  const users = await loadUsers();
  const user = users.find((u) => normalizeUsername(u.username) === normalizeUsername(username));
  // Same message either way, so nobody can find out which usernames exist.
  if (!user || (await hashPassword(String(password ?? ''), user.salt)) !== user.passwordHash) {
    throw new Error('Wrong username or password.');
  }
  await saveData(AUTH_KEYS.LAST_USER_ID, user.id);
  return publicUser(user);
}

/** Changes account settings such as { biometricEnabled, biometricAsked }. Returns the updated account. */
export async function updateUserSettings(userId, changes) {
  const users = await loadUsers();
  const allowed = {};
  if ('biometricEnabled' in changes) allowed.biometricEnabled = Boolean(changes.biometricEnabled);
  if ('biometricAsked' in changes) allowed.biometricAsked = Boolean(changes.biometricAsked);
  let updated = null;
  const next = users.map((u) => {
    if (u.id !== userId) return u;
    updated = { ...u, ...allowed };
    return updated;
  });
  if (!updated) throw new Error('Account not found.');
  await saveUsers(next);
  return publicUser(updated);
}
