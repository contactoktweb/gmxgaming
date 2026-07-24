'use client'

import { useState } from 'react'

const COUNTRY_CODES = [
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+58', label: '🇻🇪 +58' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+593', label: '🇪🇨 +593' },
  { code: '+502', label: '🇬🇹 +502' },
  { code: '+53', label: '🇨🇺 +53' },
  { code: '+591', label: '🇧🇴 +591' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+504', label: '🇭🇳 +504' },
  { code: '+503', label: '🇸🇻 +503' },
  { code: '+595', label: '🇵🇾 +595' },
  { code: '+505', label: '🇳🇮 +505' },
  { code: '+506', label: '🇨🇷 +506' },
  { code: '+507', label: '🇵🇦 +507' },
  { code: '+598', label: '🇺🇾 +598' },
  { code: '+34', label: '🇪🇸 +34' },
]

interface PhoneInputProps {
  id: string
  name: string
  required?: boolean
}

export function PhoneInput({ id, name, required }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+52')
  const [phone, setPhone] = useState('')

  return (
    <div className="flex gap-2">
      {/* Hidden input to combine country code and phone number for form submission */}
      <input type="hidden" name={name} value={`${countryCode} ${phone}`} />
      
      <div className="relative shrink-0 w-28">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-full appearance-none rounded-md border border-border bg-background px-3 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.label} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <input
        type="tel"
        id={id}
        required={required}
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
        pattern="\d{7,14}"
        className="w-full rounded-md border border-border bg-background px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="1234567890"
      />
    </div>
  )
}
