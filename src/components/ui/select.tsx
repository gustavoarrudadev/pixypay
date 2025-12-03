import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
}

export function Select({ label, helperText, className, children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      )}
      <div className="relative">
        <select
          {...props}
          className={
            `w-full appearance-none rounded-md border bg-white dark:bg-neutral-900 ` +
            `border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm ` +
            `text-neutral-900 dark:text-neutral-50 ` +
            `focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 ` +
            `transition-colors ${className || ''}`
          }
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {helperText && (
        <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">{helperText}</span>
      )}
    </div>
  )}