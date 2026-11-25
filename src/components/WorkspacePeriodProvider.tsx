'use client';

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import { MONTHS, YEARS } from '@/lib/period';

export { MONTHS, YEARS };

interface WorkspacePeriodContextValue {
  month: string;
  year: string;
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  todayFormatted: string;
  todayWeekday: string;
}

const WorkspacePeriodContext = createContext<WorkspacePeriodContextValue | null>(null);

const emptySubscribe = () => () => {};

function getClientDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function getServerDateStamp(): string {
  return '2026-10-22';
}

export function WorkspacePeriodProvider({
  children,
  initialDateStamp,
}: {
  children: React.ReactNode;
  initialDateStamp?: string;
}) {
  const dateStamp = useSyncExternalStore(
    emptySubscribe,
    getClientDateStamp,
    () => initialDateStamp ?? getServerDateStamp()
  );

  const [overrideMonth, setOverrideMonth] = useState<string | null>(null);
  const [overrideYear, setOverrideYear] = useState<string | null>(null);

  const derived = useMemo(() => {
    const [yStr, mStr, dStr] = dateStamp.split('-');
    const yearNum = Number(yStr) || 2026;
    const monthIdx = Number(mStr) || 0;
    const dayNum = Number(dStr) || 1;
    const dateObj = new Date(yearNum, monthIdx, dayNum);

    const defaultMonth = MONTHS[monthIdx] ?? 'November';
    const yearCandidate = String(yearNum);
    const defaultYear = YEARS.includes(yearCandidate as (typeof YEARS)[number])
      ? yearCandidate
      : '2026';

    return {
      defaultMonth,
      defaultYear,
      todayFormatted: new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(dateObj),
      todayWeekday: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
      }).format(dateObj),
    };
  }, [dateStamp]);

  const month = overrideMonth ?? derived.defaultMonth;
  const year = overrideYear ?? derived.defaultYear;

  return (
    <WorkspacePeriodContext.Provider
      value={{
        month,
        year,
        setMonth: setOverrideMonth,
        setYear: setOverrideYear,
        todayFormatted: derived.todayFormatted,
        todayWeekday: derived.todayWeekday,
      }}
    >
      {children}
    </WorkspacePeriodContext.Provider>
  );
}

export function useWorkspacePeriod(): WorkspacePeriodContextValue {
  const ctx = useContext(WorkspacePeriodContext);
  if (!ctx) {
    throw new Error('useWorkspacePeriod must be used within WorkspacePeriodProvider');
  }
  return ctx;
}
