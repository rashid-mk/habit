import React, { useState } from 'react'

interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  format?: (value: any) => string
}

interface DataTableProps {
  data: Record<string, any>[]
  columns: DataTableColumn[]
  caption: string
  className?: string
  ariaLabel?: string
}

/**
 * AccessibleDataTable Component
 * Provides a screen reader accessible alternative to charts
 * Includes sorting, keyboard navigation, and proper ARIA labels
 */
export function AccessibleDataTable({ 
  data, 
  columns, 
  caption, 
  className = '',
  ariaLabel 
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Sort data based on current sort settings
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]
      
      let comparison = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, columnKey: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSort(columnKey)
    }
  }

  if (data.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table 
        className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow"
        role="table"
        aria-label={ariaLabel || caption}
      >
        <caption className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
                onKeyDown={(e) => column.sortable && handleKeyDown(e, column.key)}
                tabIndex={column.sortable ? 0 : -1}
                role={column.sortable ? 'columnheader button' : 'columnheader'}
                aria-sort={
                  sortColumn === column.key 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined
                }
                aria-label={
                  column.sortable 
                    ? `${column.label}, sortable column${sortColumn === column.key ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`
                    : column.label
                }
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr 
              key={index}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 focus-within:bg-gray-50 dark:focus-within:bg-gray-700/50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600"
                  role="cell"
                >
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        Table showing {data.length} rows of data
        {sortColumn && ` sorted by ${columns.find(col => col.key === sortColumn)?.label} in ${sortDirection}ending order`}
      </div>
    </div>
  )
}