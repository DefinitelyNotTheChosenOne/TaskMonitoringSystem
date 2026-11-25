import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';
import { CompanyProfile } from '@/lib/types/task';

export interface CurrentUserContext {
  userId: string;
  role: string | null;
  companyId: string | null;
  name: string | null;
  email: string | null;
  company: CompanyProfile | null;
}

export async function getUserRole(): Promise<string | null> {
  const ctx = await getCurrentUserContext();
  return ctx?.role ?? null;
}

export const getCurrentUserContext = cache(async (): Promise<CurrentUserContext | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return null;

  const claimEmail =
    typeof claimsData?.claims?.email === 'string' ? claimsData.claims.email : null;

  const { data: employee } = await supabase
    .from('employees')
    .select('role, company_id, name, email')
    .eq('id', userId)
    .maybeSingle();

  let company: CompanyProfile | null = null;
  if (employee?.company_id) {
    const { data: compRow, error: compErr } = await supabase
      .from('companies')
      .select('id, name, tagline, mission, logo_url')
      .eq('id', employee.company_id)
      .maybeSingle();

    if (!compErr && compRow) {
      company = {
        id: String(compRow.id),
        name: compRow.name ?? 'Workspace',
        tagline: compRow.tagline ?? 'Team Task Management Workspace',
        mission:
          compRow.mission ??
          'Organize, prioritize, and track your team deliverables.',
        logo_url: compRow.logo_url ?? null,
      };
    }
  }

  return {
    userId,
    role: employee?.role ?? null,
    companyId: employee?.company_id ?? null,
    name: employee?.name ?? null,
    email: employee?.email ?? claimEmail,
    company,
  };
});
