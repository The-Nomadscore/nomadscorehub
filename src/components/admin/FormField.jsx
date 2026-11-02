import React from 'react'

const inputClass =
  'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-sm text-brand-text ' +
  'placeholder:text-brand-muted focus:outline-none focus:border-brand-accent disabled:opacity-60';

function formatLabel(str) {
  if (!str) return ""
  const cleanStr = str.replace(/_/g, " ").toLowerCase()

  return cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1)
}

export function InputField ({label, name, value, handleChange, error, ...props}) {
  return (
    <div className='w-full'>
        <label className="block text-sm text-brand-muted mb-2" htmlFor={name}>
            {label ? label : formatLabel(name)}
        </label>

        <input
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            className={inputClass}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${name}-error` : undefined}
            {...props}
        />
        {error && <p className="text-brand-danger text-xs mt-1">{error}</p>}
    </div>
  )
}