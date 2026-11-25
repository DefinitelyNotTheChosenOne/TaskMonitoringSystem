'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Sliders,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/components/ui/ToastProvider';
import {
  ThemePreference,
  applyTheme,
  getResolvedSystemScheme,
  getStoredTheme,
  subscribeToThemeChanges,
} from '@/lib/theme';
import {
  addWorkspaceOption,
  changeOwnPassword,
  deleteWorkspaceOption,
  getCurrentSettingsData,
  saveCompanyBranding,
  saveOwnProfile,
  seedDefaultOptionsIfEmpty,
} from '@/lib/api/settings';
import { isSafeLogoUrl } from '@/lib/types/task';
import { EmployeeDetailedProfile, WorkspaceOptionItem } from '@/lib/types/workspace';

type DensityPreference = 'comfortable' | 'compact';

const DENSITY_KEY = 'tms-density';
const NOTIF_PREFS_KEY = 'tms-notif-prefs';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [profile, setProfile] = useState<EmployeeDetailedProfile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Notification & UI preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [themePref, setThemePref] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>('light');
  const [density, setDensity] = useState<DensityPreference>('comfortable');

  // Admin workspace branding & taxonomy
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [companyMission, setCompanyMission] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<WorkspaceOptionItem[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newDepartmentLabel, setNewDepartmentLabel] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    async function init() {
      const data = await getCurrentSettingsData();
      if (!active) return;

      setSchemaReady(data.schemaReady);
      setProfile(data.profile);
      setOptions(data.options);

      if (data.profile) {
        setFullName(data.profile.name);
        setEmail(data.profile.email ?? '');
        setPhone(data.profile.phone ?? '');
        setPosition(data.profile.position ?? '');
      }

      if (data.company) {
        setCompanyId(data.company.id);
        setCompanyName(data.company.name);
        setCompanyTagline(data.company.tagline);
        setCompanyMission(data.company.mission);
        setCompanyLogoUrl(data.company.logo_url ?? '');
        setLogoImgFailed(false);
      } else {
        setCompanyId(data.profile?.company_id ?? null);
      }

      try {
        const storedDensity = window.localStorage.getItem(DENSITY_KEY);
        if (storedDensity === 'compact' || storedDensity === 'comfortable') {
          setDensity(storedDensity);
        }
        const storedNotifs = window.localStorage.getItem(NOTIF_PREFS_KEY);
        if (storedNotifs) {
          const parsed = JSON.parse(storedNotifs) as { email?: boolean; push?: boolean };
          if (typeof parsed.email === 'boolean') setEmailNotifs(parsed.email);
          if (typeof parsed.push === 'boolean') setPushNotifs(parsed.push);
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }

      setThemePref(getStoredTheme());
      setSystemScheme(getResolvedSystemScheme());
      setLoading(false);
    }

    void init();

    const unsub = subscribeToThemeChanges(() => {
      setThemePref(getStoredTheme());
      setSystemScheme(getResolvedSystemScheme());
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const persistNotifPrefs = (nextEmail: boolean, nextPush: boolean) => {
    try {
      window.localStorage.setItem(
        NOTIF_PREFS_KEY,
        JSON.stringify({ email: nextEmail, push: nextPush })
      );
    } catch {
      // Ignore storage errors
    }
    showToast({ title: 'Notification preferences saved', tone: 'info' });
  };

  const handleThemeChange = (next: ThemePreference) => {
    setThemePref(next);
    applyTheme(next);
    showToast({
      title: 'Appearance updated',
      description:
        next === 'system'
          ? `Following system preference (currently ${systemScheme}).`
          : `Pinned theme to ${next} mode.`,
      tone: 'info',
    });
  };

  const handleDensityChange = (next: DensityPreference) => {
    setDensity(next);
    try {
      window.localStorage.setItem(DENSITY_KEY, next);
      if (next === 'compact') {
        document.documentElement.dataset.density = 'compact';
      } else {
        delete document.documentElement.dataset.density;
      }
    } catch {
      // Ignore storage errors
    }
    showToast({
      title: 'Workspace density updated',
      description: next === 'compact' ? 'Compact density enabled.' : 'Comfortable spacing restored.',
      tone: 'info',
    });
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    const res = await saveOwnProfile(profile.id, {
      name: fullName,
      phone,
      position,
    });
    setSavingProfile(false);

    if (!res.ok) {
      showToast({
        title: 'Failed to save profile',
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }

    showToast({
      title: 'Profile updated',
      description: res.migrationRequired
        ? 'Saved core fields. Run supabase_migration.sql to persist phone.'
        : `Saved details for ${fullName}.`,
      tone: 'success',
    });
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      showToast({
        title: 'Password too short',
        description: 'Enter at least 6 characters.',
        tone: 'danger',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({
        title: 'Passwords do not match',
        description: 'Confirm password must match the new password.',
        tone: 'danger',
      });
      return;
    }

    setSavingPw(true);
    const res = await changeOwnPassword(newPassword);
    setSavingPw(false);

    if (!res.ok) {
      showToast({
        title: 'Could not update password',
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    showToast({ title: 'Password updated successfully', tone: 'success' });
  };

  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 160;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          showToast({ title: 'Could not process image', tone: 'danger' });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpData = canvas.toDataURL('image/webp', 0.85);
        const nextUrl = webpData.startsWith('data:image/webp')
          ? webpData
          : canvas.toDataURL('image/png');
        setCompanyLogoUrl(nextUrl);
        setLogoImgFailed(false);
      };
      img.onerror = () => {
        showToast({
          title: 'Invalid image file',
          description: 'Please upload a PNG, JPEG, or WebP logo.',
          tone: 'danger',
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) return;

    if (companyLogoUrl.trim() && !isSafeLogoUrl(companyLogoUrl)) {
      showToast({
        title: 'Invalid logo URL',
        description: 'Enter an https:// URL or upload a PNG, JPEG, or WebP image.',
        tone: 'warning',
      });
      return;
    }

    setSavingBranding(true);
    const res = await saveCompanyBranding(companyId, {
      name: companyName,
      tagline: companyTagline,
      mission: companyMission,
      logo_url: companyLogoUrl,
    });
    setSavingBranding(false);

    if (!res.ok) {
      showToast({
        title: 'Could not save company branding',
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }

    showToast({ title: 'Company branding updated', tone: 'success' });
  };

  const handleAddOption = async (
    event: React.FormEvent<HTMLFormElement>,
    type: 'category' | 'department'
  ) => {
    event.preventDefault();
    const label = (type === 'category' ? newCategoryLabel : newDepartmentLabel).trim();
    if (!label) return;

    setSavingOption(true);
    const res = await addWorkspaceOption(companyId, type, label);
    setSavingOption(false);

    if (res.error || !res.option) {
      showToast({
        title: `Could not add ${type}`,
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }

    setOptions((prev) => [...prev, res.option!]);
    if (type === 'category') {
      setNewCategoryLabel('');
    } else {
      setNewDepartmentLabel('');
    }
    showToast({ title: `Added ${type}: ${label}`, tone: 'success' });
  };

  const handleDeleteOption = async (item: WorkspaceOptionItem) => {
    const res = await deleteWorkspaceOption(item.id);
    if (!res.ok) {
      showToast({ title: 'Remove failed', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    setOptions((prev) => prev.filter((o) => o.id !== item.id));
    showToast({ title: `Removed "${item.label}"`, tone: 'info' });
  };

  const handleSeedDefaults = async () => {
    setSavingOption(true);
    const res = await seedDefaultOptionsIfEmpty(companyId);
    if (!res.ok) {
      setSavingOption(false);
      showToast({ title: 'Seed failed', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    const refreshed = await getCurrentSettingsData();
    setOptions(refreshed.options);
    setSavingOption(false);
    showToast({ title: 'Default categories & departments seeded', tone: 'success' });
  };

  const isAdminOrAbove = profile?.role === 'admin' || profile?.role === 'superadmin';
  const categories = options.filter((o) => o.option_type === 'category');
  const departments = options.filter((o) => o.option_type === 'department');

  return (
    <div className="settings-page">
      {!schemaReady && (
        <div className="info-banner">
          <span>
            Run <code>supabase_migration.sql</code> in Supabase SQL Editor to persist company
            branding and custom workspace taxonomy options.
          </span>
        </div>
      )}

      {/* Profile Settings */}
      <section className="surface-card" aria-labelledby="settings-profile-heading">
        <div className="section-head-row">
          <User size={18} className="section-head-icon" aria-hidden="true" />
          <h2 id="settings-profile-heading" className="card-title">
            Profile Information
          </h2>
        </div>

        <form className="form-stack" onSubmit={(e) => void handleSaveProfile(e)}>
          <p className="form-hint">Fields marked * are required.</p>
          <div className="form-grid--2">
            <div className="field">
              <label htmlFor="settings-name" className="field-label">
                Full Name<span className="field-required" aria-hidden="true">*</span>
              </label>
              <input
                id="settings-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                data-error="settings-name-error"
                className="field-input"
                value={fullName}
                disabled={loading}
                onChange={(e) => setFullName(e.target.value)}
              />
              <div id="settings-name-error" className="error-msg">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Full name is required.</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="settings-email" className="field-label">
                Email Address
              </label>
              <input
                id="settings-email"
                name="email"
                type="email"
                className="field-input"
                value={email}
                readOnly
                disabled
              />
            </div>

            <div className="field">
              <label htmlFor="settings-phone" className="field-label">
                Phone Number
              </label>
              <input
                id="settings-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="field-input"
                value={phone}
                disabled={loading}
                placeholder="+63"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="settings-position" className="field-label">
                Position / Title
              </label>
              <input
                id="settings-position"
                name="position"
                type="text"
                autoComplete="organization-title"
                className="field-input"
                value={position}
                disabled={loading}
                placeholder="e.g. Operations Lead"
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions-end">
            <button type="submit" className="btn btn-primary" disabled={loading || savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>

      {/* Security / Change Password */}
      <section className="surface-card" aria-labelledby="settings-security-heading">
        <div className="section-head-row">
          <KeyRound size={18} className="section-head-icon" aria-hidden="true" />
          <h2 id="settings-security-heading" className="card-title">
            Security & Password
          </h2>
        </div>

        <form className="form-stack" onSubmit={(e) => void handleChangePassword(e)}>
          <div className="form-grid--2">
            <div className="field">
              <label htmlFor="settings-new-pw" className="field-label">
                New Password<span className="field-required" aria-hidden="true">*</span>
              </label>
              <div className="password-field">
                <input
                  id="settings-new-pw"
                  type={showNewPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="field-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPw((prev) => !prev)}
                  aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                  aria-pressed={showNewPw}
                >
                  {showNewPw ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="settings-confirm-pw" className="field-label">
                Confirm New Password<span className="field-required" aria-hidden="true">*</span>
              </label>
              <input
                id="settings-confirm-pw"
                type={showNewPw ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={6}
                required
                className="field-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="form-actions-end">
            <button type="submit" className="btn btn-secondary" disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="surface-card" aria-labelledby="settings-notifs-heading">
        <div className="section-head-row">
          <Bell size={18} className="section-head-icon" aria-hidden="true" />
          <h2 id="settings-notifs-heading" className="card-title">
            Notifications
          </h2>
        </div>

        <div className="form-stack">
          <Switch
            id="email-notifs-switch"
            label="Email Notifications"
            description="Receive daily summaries and task updates via email."
            checked={emailNotifs}
            onChange={(checked) => {
              setEmailNotifs(checked);
              persistNotifPrefs(checked, pushNotifs);
            }}
          />
          <Switch
            id="push-notifs-switch"
            label="Desktop & Overdue Alerts"
            description="Highlight overdue and due-today items in the top notification center."
            checked={pushNotifs}
            onChange={(checked) => {
              setPushNotifs(checked);
              persistNotifPrefs(emailNotifs, checked);
            }}
          />
        </div>
      </section>

      {/* Appearance & Density */}
      <section className="surface-card" aria-labelledby="settings-appearance-heading">
        <div className="section-head-row">
          <Sliders size={18} className="section-head-icon" aria-hidden="true" />
          <h2 id="settings-appearance-heading" className="card-title">
            Appearance & Preferences
          </h2>
        </div>

        <div className="form-stack">
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label" style={{ marginBlockEnd: '0.625rem' }}>
              Color Scheme
            </legend>
            <div className="choice-grid">
              <label className="choice-card">
                <input
                  type="radio"
                  name="color-scheme-pref"
                  value="system"
                  className="choice-card-radio"
                  checked={themePref === 'system'}
                  onChange={() => handleThemeChange('system')}
                />
                <div>
                  <div className="choice-card-title">System</div>
                  <div className="choice-card-desc">
                    Currently {systemScheme === 'dark' ? 'Dark' : 'Light'}
                  </div>
                </div>
              </label>

              <label className="choice-card">
                <input
                  type="radio"
                  name="color-scheme-pref"
                  value="light"
                  className="choice-card-radio"
                  checked={themePref === 'light'}
                  onChange={() => handleThemeChange('light')}
                />
                <div>
                  <div className="choice-card-title">Light</div>
                  <div className="choice-card-desc">Crisp daylight workspace</div>
                </div>
              </label>

              <label className="choice-card">
                <input
                  type="radio"
                  name="color-scheme-pref"
                  value="dark"
                  className="choice-card-radio"
                  checked={themePref === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                />
                <div>
                  <div className="choice-card-title">Dark</div>
                  <div className="choice-card-desc">Low-glare dark workspace</div>
                </div>
              </label>
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label" style={{ marginBlockEnd: '0.625rem' }}>
              Table & Card Density
            </legend>
            <div className="choice-grid">
              <label className="choice-card">
                <input
                  type="radio"
                  name="density-pref"
                  value="comfortable"
                  className="choice-card-radio"
                  checked={density === 'comfortable'}
                  onChange={() => handleDensityChange('comfortable')}
                />
                <div>
                  <div className="choice-card-title">Comfortable</div>
                  <div className="choice-card-desc">Standard SaaS padding</div>
                </div>
              </label>

              <label className="choice-card">
                <input
                  type="radio"
                  name="density-pref"
                  value="compact"
                  className="choice-card-radio"
                  checked={density === 'compact'}
                  onChange={() => handleDensityChange('compact')}
                />
                <div>
                  <div className="choice-card-title">Compact</div>
                  <div className="choice-card-desc">Denser tables & cards</div>
                </div>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      {/* Admin / Superadmin Workspace Customization */}
      {isAdminOrAbove && (
        <section className="surface-card" aria-labelledby="settings-workspace-heading">
          <div className="card-header">
            <div className="section-head-row" style={{ marginBlockEnd: 0 }}>
              <Building2 size={18} className="section-head-icon" aria-hidden="true" />
              <h2 id="settings-workspace-heading" className="card-title">
                Workspace Branding & Taxonomy (Admin)
              </h2>
            </div>
            {options.length === 0 && schemaReady && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={savingOption}
                onClick={() => void handleSeedDefaults()}
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>Seed Defaults</span>
              </button>
            )}
          </div>

          <div className="form-stack">
            {companyId && (
              <form className="form-stack" onSubmit={(e) => void handleSaveBranding(e)}>
                <div className="form-grid--2">
                  <div className="field">
                    <label htmlFor="brand-name" className="field-label">
                      Company Name<span className="field-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="brand-name"
                      type="text"
                      required
                      disabled={!schemaReady}
                      className="field-input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="brand-tagline" className="field-label">
                      Company Tagline
                    </label>
                    <input
                      id="brand-tagline"
                      type="text"
                      disabled={!schemaReady}
                      className="field-input"
                      value={companyTagline}
                      onChange={(e) => setCompanyTagline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="brand-logo-url" className="field-label">
                    Company Logo
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {isSafeLogoUrl(companyLogoUrl) && !logoImgFailed ? (
                      <div className="company-logo-badge">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={companyLogoUrl}
                          alt={`${companyName || 'Company'} logo preview`}
                          width={56}
                          height={56}
                          className="company-logo-img"
                          onError={() => setLogoImgFailed(true)}
                        />
                      </div>
                    ) : (
                      <div className="company-logo-badge" aria-hidden="true">
                        <Building2 size={22} />
                      </div>
                    )}
                    <input
                      id="brand-logo-url"
                      type="text"
                      disabled={!schemaReady}
                      className="field-input"
                      style={{ flex: '1 1 16rem' }}
                      placeholder="https://example.com/logo.png"
                      value={companyLogoUrl}
                      onChange={(e) => {
                        setCompanyLogoUrl(e.target.value);
                        setLogoImgFailed(false);
                      }}
                    />
                    <label htmlFor="brand-logo-file" className="visually-hidden">
                      Upload company logo image
                    </label>
                    <input
                      id="brand-logo-file"
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="visually-hidden"
                      disabled={!schemaReady}
                      onChange={handleLogoFileSelect}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={!schemaReady}
                      onClick={() => logoFileInputRef.current?.click()}
                    >
                      <Upload size={14} aria-hidden="true" />
                      <span>Upload Logo</span>
                    </button>
                    {companyLogoUrl && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!schemaReady}
                        onClick={() => {
                          setCompanyLogoUrl('');
                          setLogoImgFailed(false);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="brand-mission" className="field-label">
                    Mission Statement
                  </label>
                  <textarea
                    id="brand-mission"
                    disabled={!schemaReady}
                    className="field-textarea"
                    value={companyMission}
                    onChange={(e) => setCompanyMission(e.target.value)}
                  />
                </div>

                <div className="form-actions-end">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!schemaReady || savingBranding}
                  >
                    {savingBranding ? 'Saving...' : 'Save Company Branding'}
                  </button>
                </div>
              </form>
            )}

            <div className="form-grid--2">
              <div className="detail-section">
                <h3>Task Categories ({categories.length})</h3>
                <div className="chip-list">
                  {categories.map((cat) => (
                    <span key={cat.id} className="chip-item">
                      <span>{cat.label}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        aria-label={`Remove category ${cat.label}`}
                        onClick={() => void handleDeleteOption(cat)}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  {categories.length === 0 && (
                    <span className="card-subtitle">Using default system categories.</span>
                  )}
                </div>

                <form
                  className="inline-add-form"
                  onSubmit={(e) => void handleAddOption(e, 'category')}
                >
                  <label htmlFor="new-category-input" className="visually-hidden">
                    New category name
                  </label>
                  <input
                    id="new-category-input"
                    type="text"
                    className="field-input"
                    placeholder="Add category..."
                    disabled={!schemaReady || savingOption}
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={!schemaReady || savingOption}
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              <div className="detail-section">
                <h3>Departments ({departments.length})</h3>
                <div className="chip-list">
                  {departments.map((dept) => (
                    <span key={dept.id} className="chip-item">
                      <span>{dept.label}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        aria-label={`Remove department ${dept.label}`}
                        onClick={() => void handleDeleteOption(dept)}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  {departments.length === 0 && (
                    <span className="card-subtitle">Using default system departments.</span>
                  )}
                </div>

                <form
                  className="inline-add-form"
                  onSubmit={(e) => void handleAddOption(e, 'department')}
                >
                  <label htmlFor="new-dept-input" className="visually-hidden">
                    New department name
                  </label>
                  <input
                    id="new-dept-input"
                    type="text"
                    className="field-input"
                    placeholder="Add department..."
                    disabled={!schemaReady || savingOption}
                    value={newDepartmentLabel}
                    onChange={(e) => setNewDepartmentLabel(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={!schemaReady || savingOption}
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
