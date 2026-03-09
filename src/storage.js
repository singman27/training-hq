import { supabase } from './supabaseClient';

const LOCAL_KEY = 'thq-v3';
const DEFAULT_DATA = { logs: {}, phase: 1, ov: {}, ib: [], ci: {}, pain: {}, ec: {}, padel: { matches: [], shots: {}, focus: {}, videos: [], tournaments: [] } };

// --- Local cache (instant reads) ---

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_DATA };
}

function saveLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

// --- Supabase sync ---

let saveTimeout = null;

export async function loadFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_data')
    .select('data, updated_at')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Supabase load error:', error);
    return null;
  }

  return data?.data || null;
}

export async function saveToSupabase(appData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_data')
    .upsert({
      id: user.id,
      data: appData,
      updated_at: new Date().toISOString()
    });

  if (error) console.error('Supabase save error:', error);
}

// --- Combined save: local instantly, Supabase debounced ---

export function saveData(data) {
  saveLocal(data);
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToSupabase(data);
  }, 1500);
}

// --- Initial load: remote wins if it exists ---

export async function initialLoad() {
  const local = loadLocal();

  try {
    const remote = await loadFromSupabase();
    if (remote) {
      saveLocal(remote);
      return remote;
    }
    if (local && Object.keys(local.logs || {}).length > 0) {
      await saveToSupabase(local);
    }
    return local;
  } catch {
    return local;
  }
}

// --- Export / Import ---

export function exportData() {
  const data = loadLocal();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `training-hq-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.logs !== undefined && data.phase !== undefined) {
          saveData(data);
          resolve(data);
        } else {
          reject(new Error('Invalid backup file'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
