/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { saveAs } from 'file-saver';
import type { AppProject, PersistedState } from './types';

const STORAGE_KEY = 'previewkit:state:v1';

export const loadPersistedState = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.apps) || parsed.apps.length === 0) return null;
    return parsed as PersistedState;
  } catch (err) {
    console.error('Failed to read saved project from localStorage', err);
    return null;
  }
};

export const savePersistedState = (state: PersistedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save project to localStorage', err);
  }
};

const slugify = (name: string) =>
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';

export const exportAppToFile = (app: AppProject) => {
  const payload = { version: 1, exportedAt: new Date().toISOString(), app };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  saveAs(blob, `${slugify(app.name)}.previewkit.json`);
};

const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class ImportError extends Error {}

/** Parses an exported .previewkit.json file, assigning fresh ids so it never collides with existing apps. */
export const parseImportedApp = (raw: string): AppProject => {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ImportError('That file is not valid JSON.');
  }

  const app = (json as { app?: unknown })?.app ?? json;
  if (
      typeof app !== 'object' ||
      app === null ||
      !Array.isArray((app as AppProject).screens) ||
      (app as AppProject).screens.length === 0
  ) {
    throw new ImportError('That file does not look like a PreviewKit app export.');
  }

  const source = app as AppProject;
  const idMap = new Map<string, string>();
  const screens = source.screens.map((screen) => {
    const id = newId();
    idMap.set(screen.id, id);
    return { ...screen, id };
  });

  return {
    ...source,
    id: newId(),
    name: source.name || 'Imported App',
    screens,
    activeScreenId: idMap.get(source.activeScreenId) ?? screens[0].id,
  };
};
