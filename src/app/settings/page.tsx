"use client";

import React, { useState } from "react";
import { User, Bell, Sliders } from "lucide-react";

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <>
      <style>{`
        .neu-toggle {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background-color: var(--bg);
          box-shadow: var(--shadow-inset);
          border: none;
          position: relative;
          cursor: pointer;
          outline: none;
          display: flex;
          align-items: center;
          padding: 0 4px;
          transition: all 0.3s ease;
        }
        .neu-toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
        }
        .neu-toggle-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          box-shadow: var(--shadow-extrude);
          transition: all 0.3s ease;
        }
      `}</style>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>SETTINGS</h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile Settings */}
          <section className="neu-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--accent)', paddingBottom: '12px' }}>
              <User size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Profile Information</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" className="neu-input" defaultValue="Jane Smith" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" className="neu-input" defaultValue="jane.smith@example.com" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</label>
                <input type="text" className="neu-input" defaultValue="Project Manager" disabled style={{ opacity: 0.7 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="neu-button">Save Changes</button>
            </div>
          </section>

          {/* Notifications */}
          <section className="neu-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--accent)', paddingBottom: '12px' }}>
              <Bell size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Notifications</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Email Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Receive daily summaries and task updates via email.</div>
                </div>
                <Toggle checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Push Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Get instant alerts for critical task changes.</div>
                </div>
                <Toggle checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="neu-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--accent)', paddingBottom: '12px' }}>
              <Sliders size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Preferences</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Dark Mode</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Toggle between light and dark themes (Note: System respects OS setting).</div>
                </div>
                <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Language</label>
                <select className="neu-select">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="neu-toggle"
    >
      <div
        className="neu-toggle-thumb"
        style={{
          backgroundColor: checked ? 'var(--accent)' : 'var(--text-secondary)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
