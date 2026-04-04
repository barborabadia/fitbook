import { supabase } from './supabase'

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signInWithFacebook() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Zkontroluje, zda je přihlášený uživatel admin (trenér)
export function isAdmin(user) {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('⚠️ VITE_ADMIN_EMAIL není nastavený v .env!')
    return false
  }
  return user?.email === adminEmail
}
