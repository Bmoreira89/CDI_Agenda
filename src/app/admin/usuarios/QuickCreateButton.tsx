'use client'

import { useTransition } from 'react'

function toSlug(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[—-]/g, ' ')
    .replace(/\s+/g, '_')
    .trim()
}

export default function QuickCreateButton() {
  const [pending, start] = useTransition()

  return (
    <button
      disabled={pending}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      onClick={async () => {
        const name = window.prompt('Nome do usuário:')?.trim() || ''
        if (!name) return

        const email = window.prompt('Email do usuário:')?.trim() || ''
        if (!email) return

        const roleRaw =
          window.prompt('Perfil (ADMIN ou MEDICO):', 'MEDICO')?.trim().toUpperCase() ||
          'MEDICO'
        const role = roleRaw === 'ADMIN' ? 'ADMIN' : 'MEDICO'

        const citiesRaw =
          window.prompt(
            'Cidades (nomes separados por vírgula, exatamente como aparecem na lista):'
          ) || ''
        const allowedCitiesCsv = citiesRaw
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
          .map(toSlug)
          .join(',')

        start(async () => {
          const r = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              role,
              allowedCitiesCsv: allowedCitiesCsv || null,
            }),
          })
          if (!r.ok) {
            const err = await r.json().catch(() => ({}))
            alert(err?.error || 'Falha ao criar usuário')
            return
          }
          location.reload()
        })
      }}
    >
      Novo usuário
    </button>
  )
}
