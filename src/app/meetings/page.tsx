"use client";

import React from "react";

// Mock Data Array for mapping repeatable meeting record blocks
const mockMeetings = [
  {
    id: 1,
    meetingNo: "MTG-2026-001",
    meetingName: "Q3 Strategy Planning",
    objective: "Define roadmap for Q3 deliverables and resource allocation",
    participants: "John S., Alice M., Bob K.",
    organizer: "Sarah L.",
    date: "Aug 10, 2026",
    time: "10:00 AM - 12:00 PM",
    location: "Conference Room A / Zoom",
    minutes: [
      "Reviewed Q2 performance metrics and acknowledged exceeding targets by 15%.",
      "Identified bottlenecks in the current deployment pipeline.",
      "Proposed new sprint cycle duration to accommodate testing phases.",
      "Discussed onboarding requirements for Q4 hires."
    ],
    agenda: [
      "1. Q2 Review & Metrics",
      "2. Resource Allocation",
      "3. Pipeline Optimization",
      "4. Open Floor"
    ],
    actionItems: [
      { no: "01", item: "Finalize budget report", person: "Alice M.", dueDate: "Aug 12, 2026", status: "In Progress" },
      { no: "02", item: "Update Jira boards", person: "Bob K.", dueDate: "Aug 11, 2026", status: "Completed" },
      { no: "03", item: "Schedule follow-up with Dev team", person: "John S.", dueDate: "Aug 14, 2026", status: "Not Started" }
    ]
  },
  {
    id: 2,
    meetingNo: "MTG-2026-002",
    meetingName: "Design System Sync",
    objective: "Align on Neumorphism component updates and accessibility",
    participants: "Alice M., Tim R., Sarah L.",
    organizer: "Alice M.",
    date: "Aug 15, 2026",
    time: "02:00 PM - 03:00 PM",
    location: "Google Meet",
    minutes: [
      "Confirmed variable namings for shadow extrusion and inset.",
      "Addressed contrast ratio issues on disabled buttons.",
      "Agreed to proceed with inline styling conventions for consistency."
    ],
    agenda: [
      "1. Shadow Consistency",
      "2. Accessibility Standards",
      "3. Documentation"
    ],
    actionItems: [
      { no: "01", item: "Draft updated CSS variables", person: "Tim R.", dueDate: "Aug 16, 2026", status: "In Progress" },
      { no: "02", item: "Run contrast checker", person: "Sarah L.", dueDate: "Aug 17, 2026", status: "Not Started" }
    ]
  }
];

export default function MeetingArchive() {
  return (
    <div style={{ padding: '24px' }}>
      {/* 1. Page Header Section */}
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>MEETING ARCHIVE</h1>
      </header>

      {/* 2. Repeatable Meeting Record Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {mockMeetings.map((meeting, index) => (
          <div key={meeting.id} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Split Panel (Metadata vs Logistics) */}
            <div className="meetings-split-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Left Side: Metadata fields */}
              <div className="neu-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Meeting:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px' }}>{meeting.meetingName}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Objective:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px', flex: 1 }}>{meeting.objective}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Participant:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px', flex: 1 }}>{meeting.participants}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Organizer:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{meeting.organizer}</span>
                </div>
              </div>

              {/* Right Side: Logistics fields */}
              <div className="neu-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Date:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{meeting.date}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Time:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{meeting.time}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--dark)', paddingBottom: '8px' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Location:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{meeting.location}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '120px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Meeting No.:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>{meeting.meetingNo}</span>
                </div>
              </div>

            </div>

            {/* Middle Split Panel (Minutes vs Agenda) */}
            <div className="meetings-split-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Left Side: Minutes of the Meeting */}
              <div className="neu-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '12px', marginBottom: '16px' }}>Minutes of the Meeting</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meeting.minutes.map((min, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '2px' }}>•</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5 }}>{min}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Agenda */}
              <div className="neu-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '12px', marginBottom: '16px' }}>Agenda</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meeting.agenda.map((ag, i) => (
                    <div key={i} style={{ color: 'var(--text-primary)', fontSize: '14px', padding: '12px 16px', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-sm)' }}>
                      {ag}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Panel: Action Items Table */}
            <div className="neu-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title" style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '12px', marginBottom: '16px' }}>Action Items</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid var(--dark)', width: '80px' }}>Item No.</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid var(--dark)' }}>Action Item</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid var(--dark)', width: '140px' }}>Person</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid var(--dark)', width: '140px' }}>Due Date</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid var(--dark)', width: '120px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.actionItems.map((action, i) => (
                      <tr key={i} className="neu-table-row">
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{action.no}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{action.item}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>{action.person}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>{action.dueDate}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            backgroundColor: 'var(--bg)', 
                            boxShadow: 'var(--shadow-extrude)',
                            color: action.status === 'Completed' ? '#10b981' : action.status === 'In Progress' ? '#3b82f6' : 'var(--text-secondary)'
                          }}>
                            {action.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Divider between meetings if there are multiple */}
            {index !== mockMeetings.length - 1 && (
              <div style={{ height: '4px', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-inset)', borderRadius: '2px', margin: '16px 0', width: '100%' }}></div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
