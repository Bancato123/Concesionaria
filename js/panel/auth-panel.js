/**
 * Panel Auth — Autenticación real con Supabase
 * Concesionaria Kevin — /panel-gestion-2709/
 */

import { supabase, requireSupabase, SUPABASE_CONFIGURED } from '../supabase-client.js';

const LOCKOUT_KEY      = 'ck_login_attempts';
const LOCKOUT_MAX      = 15;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export { SUPABASE_CONFIGURED };

// ─── Check session (call on every protected page) ────────────────────────────
export async function requireAuth(redirectTo = 'index.html') {
  if (!SUPABASE_CONFIGURED) {
    window.location.href = 'index.html?config=1';
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }
    return session;
  } catch (err) {
    console.error('[Auth] Error al verificar la sesión:', err);
    window.location.href = redirectTo;
    return null;
  }
}

// ─── Get current session without redirecting ─────────────────────────────────
export async function getSession() {
  if (!SUPABASE_CONFIGURED) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session || null;
  } catch (err) {
    console.error('[Auth] Error al obtener la sesión:', err);
    return null;
  }
}

// ─── Login with rate limiting ─────────────────────────────────────────────────
export async function login(email, password) {
  requireSupabase();

  // Check local lockout
  const lock = getlockout();
  if (lock.locked) {
    const mins = Math.ceil((lock.until - Date.now()) / 60000);
    throw new Error(`Demasiados intentos. Esperá ${mins} minuto${mins !== 1 ? 's' : ''}.`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    incrementAttempts();
    const remaining = LOCKOUT_MAX - getlockout().count;
    if (remaining <= 0) {
      throw new Error('Cuenta bloqueada 15 minutos por intentos fallidos.');
    }
    throw new Error(`Credenciales incorrectas. Intentos restantes: ${remaining}.`);
  }

  clearAttempts();
  return data.session;
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    if (supabase) await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Auth] Error al cerrar sesión:', err);
  }
  window.location.href = 'index.html';
}

// ─── Change password ─────────────────────────────────────────────────────────
export async function changePassword(newPassword) {
  requireSupabase();
  if (newPassword.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ─── Get current user ────────────────────────────────────────────────────────
export async function getUser() {
  if (!SUPABASE_CONFIGURED) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Lockout helpers ─────────────────────────────────────────────────────────
function getlockout() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(LOCKOUT_KEY) || '{}');
    if (raw.until && Date.now() > raw.until) {
      sessionStorage.removeItem(LOCKOUT_KEY);
      return { locked: false, count: 0 };
    }
    const count  = raw.count || 0;
    const locked = count >= LOCKOUT_MAX;
    return { locked, count, until: raw.until };
  } catch { return { locked: false, count: 0 }; }
}

function incrementAttempts() {
  const lock = getlockout();
  const count = lock.count + 1;
  const until = count >= LOCKOUT_MAX ? Date.now() + LOCKOUT_DURATION : lock.until;
  sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ count, until }));
}

function clearAttempts() {
  sessionStorage.removeItem(LOCKOUT_KEY);
}
