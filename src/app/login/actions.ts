'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error('SUPABASE LOGIN ERROR:', error);
    return { error: error.message || 'Unknown authentication error' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  return { success: 'Account created successfully! You can now log in.' };
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get('reset_email') as string)?.trim();

  if (!email) {
    return { error: 'Please enter your email address.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return { error: error.message };
  }

  return {
    success: 'If an account matches that email, a password reset link has been sent.',
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/login');
}
