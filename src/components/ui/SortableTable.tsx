'use client';

import React, { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'date';
  getSortValue?: (row: T) => string | number;
  renderCell: (row: T, index: number) => React.ReactNode;
  isRowHeader?: boolean;
  align?: 'start' | 'center' | 'end';
  minWidth?: string;
}

interface SortableTableProps<T> {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  responsiveStack?: boolean;
  stickyFirstCol?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  initialSort?: { key: string; direction: 'ascending' | 'descending' };
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export default function SortableTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  responsiveStack = false,
  stickyFirstCol = false,
  emptyMessage = 'No records available.',
  maxHeight,
  initialSort,
}: SortableTableProps<T>) {
  const captionId = useId();
  const [sort, setSort] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(initialSort ?? null);
  const [sortStatus, setSortStatus] = useState('');

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.getSortValue) return rows;

    const factor = sort.direction === 'ascending' ? 1 : -1;
    const getVal = col.getSortValue;

    return rows.toSorted((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (col.sortType === 'number' || col.sortType === 'date') {
        const na = typeof av === 'number' ? av : Number(av) || 0;
        const nb = typeof bv === 'number' ? bv : Number(bv) || 0;
        return factor * (na - nb);
      }
      return factor * collator.compare(String(av ?? ''), String(bv ?? ''));
    });
  }, [rows, columns, sort]);

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable || !col.getSortValue) return;
    const direction =
      sort?.key === col.key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    setSort({ key: col.key, direction });
    setSortStatus(`Sorted by ${col.label}, ${direction}, ${rows.length} rows`);
  };

  return (
    <div className="table-block">
      <div role="status" className="visually-hidden">
        {sortStatus}
      </div>
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className={`table-region ${responsiveStack ? 'table-region--stack' : ''} ${stickyFirstCol ? 'table-region--sticky-col' : ''}`}
        style={maxHeight ? ({ '--table-max-block-size': maxHeight } as React.CSSProperties) : undefined}
      >
        <table className="data-table">
          <caption id={captionId} className="visually-hidden">
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const alignClass = col.align ? `cell-align-${col.align}` : '';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={isSorted ? sort.direction : undefined}
                    className={alignClass}
                    style={col.minWidth ? { minInlineSize: col.minWidth } : undefined}
                  >
                    {col.sortable && col.getSortValue ? (
                      <button
                        type="button"
                        className="table-sort-btn"
                        onClick={() => handleSort(col)}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sort.direction === 'ascending' ? (
                            <ArrowUp size={14} aria-hidden="true" className="sort-icon sort-icon--active" />
                          ) : (
                            <ArrowDown size={14} aria-hidden="true" className="sort-icon sort-icon--active" />
                          )
                        ) : (
                          <ArrowUpDown size={14} aria-hidden="true" className="sort-icon" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => (
                <tr key={getRowKey(row, rowIndex)} className="data-table-row">
                  {columns.map((col) => {
                    const alignClass = col.align ? `cell-align-${col.align}` : '';
                    if (col.isRowHeader) {
                      return (
                        <th
                          key={col.key}
                          scope="row"
                          data-label={col.label}
                          className={`table-row-header ${alignClass}`}
                        >
                          {col.renderCell(row, rowIndex)}
                        </th>
                      );
                    }
                    return (
                      <td key={col.key} data-label={col.label} className={alignClass}>
                        {col.renderCell(row, rowIndex)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
