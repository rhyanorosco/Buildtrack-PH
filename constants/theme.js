// Central design tokens. Change colors/spacing here and the whole app follows.

export const colors = {
  primary: '#1E3A5F', // deep blueprint navy
  primaryDark: '#152B47',
  primarySoft: '#E6EDF5',
  accent: '#F59E0B', // safety orange / hard-hat yellow
  accentSoft: '#FEF3C7',

  background: '#F3F5F8',
  surface: '#FFFFFF',
  border: '#E2E8F0',

  text: '#0F172A',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#B9C7DA',

  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
  neutralSoft: '#F1F5F9',

  // Cost category colors — derived from the brand (navy + orange), no off-brand hues.
  materials: '#1E3A5F', // navy
  labor: '#F59E0B', // orange
  equipment: '#64748B', // slate
  other: '#0F766E', // teal
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// One card radius (lg) across the app; md for inputs/buttons, sm for small items.
export const radius = { sm: 8, md: 10, lg: 12, pill: 999 };

export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, display: 30 };

// Flat design: cards use a 1px border only. Kept as an empty style so existing
// imports keep working; add values here if you ever want shadows back.
export const shadow = {};

// Content never stretches wider than this (keeps tablets readable).
export const MAX_CONTENT_WIDTH = 720;
