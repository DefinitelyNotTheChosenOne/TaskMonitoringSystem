"use client";

import React, { useState } from "react";

export default function GanttChart() {
  const [activeView, setActiveView] = useState<"gantt" | "timeline">("gantt");

  // Mock data array of 15 empty objects to generate 15 placeholder rows
  const mockData = Array.from({ length: 15 }, () => ({}));

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg)' }}>
      {/* 1. Global Header & Controls */}
      <header className="flex-column" style={{ gap: '24px', marginBottom: '32px' }}>
        <div className="flex-between">
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>TIMELINE GANTT CHART</h1>
          <button
            className="neu-button"
            onClick={() => setActiveView(activeView === "gantt" ? "timeline" : "gantt")}
          >
            {activeView === "gantt" ? "Timeline Visualization" : "Gantt Chart"}
          </button>
        </div>

        <div className="gantt-summary-row">
          <div className="neu-card flex-column" style={{ gap: '4px', flex: 1 }}>
            <span className="text-secondary" style={{ fontSize: '14px' }}>Date Today</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold' }}>August 07, 2026</span>
            <span className="text-secondary" style={{ fontSize: '14px' }}>Friday</span>
          </div>

          <div className="neu-card flex-column" style={{ gap: '4px', flex: 1 }}>
            <span className="text-secondary" style={{ fontSize: '14px' }}>Overall Progress</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold' }}>0%</span>
          </div>

          <div className="neu-card flex-column" style={{ gap: '4px', flex: 1 }}>
            <span className="text-secondary" style={{ fontSize: '14px' }}>Chart Customization</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold' }}>Begin Tasks: January 01, 2024</span>
            <span className="text-secondary" style={{ fontSize: '14px' }}>Display Week No: 1</span>
          </div>
        </div>
      </header>

      {/* Conditional Rendering of Views */}
      {activeView === "gantt" ? (
        /* 2. Data Table View */
        <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '24px' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '160px' }}>
                  Person Assigned <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '100px' }}>
                  Task ID <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '220px' }}>
                  Task Description <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                  Category <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '100px' }}>
                  Priority <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                  Department <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '120px' }}>
                  Status <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '100px' }}>
                  Progress <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                  Task Start Date <span></span>
                </th>
                <th style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                  Task Due Date <span></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((_, index) => (
                <tr key={index} className="neu-table-row" style={{ height: '48px' }}>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                  <td style={{ backgroundColor: 'var(--bg)', padding: '0 16px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 3. Timeline Visualization View */
        <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '24px' }}>
          <div style={{ width: 'max-content', backgroundColor: 'var(--bg)' }}>
            
            {/* Multi-tier header structure */}
            <div className="flex-column">
              {/* Week Tier */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 'calc(31*48px/5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, fontSize: '14px' }}>
                    Week {i + 1}
                  </div>
                ))}
              </div>

              {/* Date Tier */}
              <div style={{ display: 'flex' }}>
                {['Jan 01', 'Jan 08', 'Jan 15', 'Jan 22', 'Jan 29'].map((date, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 'calc(31*48px/5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, fontSize: '14px' }}>
                    {date}
                  </div>
                ))}
              </div>

              {/* Day Number Tier */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} style={{ width: '48px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, fontSize: '14px' }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Day Letter Tier */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: 31 }, (_, i) => {
                  const letters = ["M", "T", "W", "T", "F", "S", "S"];
                  return (
                    <div key={i} style={{ width: '48px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-extrude)', fontWeight: 600, fontSize: '14px' }}>
                      {letters[i % 7]}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid rows mapping to the exact same 15 mock data entries */}
            <div className="flex-column">
              {mockData.map((_, index) => (
                <div key={index} style={{ display: 'flex', height: '48px' }}>
                  {Array.from({ length: 31 }, (_, i) => (
                    <div key={i} style={{ width: '48px', minWidth: '48px', borderBottom: '1px solid var(--dark)', borderRight: '1px solid var(--dark)', boxShadow: 'var(--shadow-inset)' }}></div>
                  ))}
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
