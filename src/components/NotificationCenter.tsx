'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import {
  fetchNotificationsAndAlerts,
  markAllDbNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { NotificationAlert } from '@/lib/types/workspace';

let notifPopoverPolyfillLoaded = false;

export default function NotificationCenter() {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    const items = await fetchNotificationsAndAlerts();
    setAlerts(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      if (
        typeof HTMLElement !== 'undefined' &&
        !('showPopover' in HTMLElement.prototype) &&
        !notifPopoverPolyfillLoaded
      ) {
        notifPopoverPolyfillLoaded = true;
        import('@oddbird/popover-polyfill').catch(() => {});
      }
      const items = await fetchNotificationsAndAlerts();
      if (!active) return;
      setAlerts(items);
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const handleToggle = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const newState = (e.nativeEvent as Event & { newState?: string }).newState;
    if (newState === 'open') {
      void loadAlerts();
    }
  };

  const handleItemClick = async (alert: NotificationAlert) => {
    if (alert.source === 'db' && !alert.isRead) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a))
      );
      await markNotificationRead(alert.id);
    }
    const el = popoverRef.current as (HTMLDivElement & { hidePopover?: () => void }) | null;
    el?.hidePopover?.();
  };

  const handleMarkAllRead = async () => {
    setAlerts((prev) => prev.map((a) => (a.source === 'db' ? { ...a, isRead: true } : a)));
    await markAllDbNotificationsRead();
  };

  return (
    <>
      <button
        type="button"
        popoverTarget="notifications-popover"
        className="btn-icon notif-trigger"
        style={{ anchorName: '--notif-anchor' } as React.CSSProperties}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} alerts)`
            : 'Notifications'
        }
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notif-badge font-mono" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div
        id="notifications-popover"
        ref={popoverRef}
        popover="auto"
        className="anchored-popover"
        style={{ positionAnchor: '--notif-anchor' } as React.CSSProperties}
        onToggle={handleToggle}
      >
        <div className="notif-head">
          <strong>Notifications & Alerts</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void handleMarkAllRead()}
          >
            <CheckCheck size={14} aria-hidden="true" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="notif-list">
          {loading && alerts.length === 0 ? (
            <p className="card-subtitle" style={{ padding: '1rem' }}>
              Checking alerts...
            </p>
          ) : alerts.length === 0 ? (
            <p className="card-subtitle" style={{ padding: '1.25rem' }}>
              All caught up! No pending task alerts or notifications.
            </p>
          ) : (
            alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.linkHref || '/tasks'}
                className={`notif-item ${!alert.isRead ? 'notif-item--unread' : ''}`}
                onClick={() => void handleItemClick(alert)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <strong style={{ fontSize: '0.8125rem' }}>{alert.title}</strong>
                  {alert.source !== 'db' && (
                    <span
                      className={`badge ${
                        alert.source === 'overdue'
                          ? 'badge--danger'
                          : alert.source === 'due_today'
                            ? 'badge--warning'
                            : 'badge--info'
                      }`}
                    >
                      {alert.source === 'overdue'
                        ? 'Overdue'
                        : alert.source === 'due_today'
                          ? 'Due Today'
                          : 'Due Soon'}
                    </span>
                  )}
                </div>
                {alert.body && (
                  <span className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                    {alert.body}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
