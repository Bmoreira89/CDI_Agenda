// src/app/admin/cidades/_buttons.tsx
'use client'

import { useTransition } from 'react'

type City = {
  id: string
  name: string
  subName: string | null
  active: boolean
}

export function NewCityButton() {
  const [pending, start] = useTransition()

  const handle = () => {
    const name = prompt('Nome da cidade (ex.: AME):')
    if (!name) return
    const subName = prompt('Subopção (opcional):') || null

    start(async () => {
      const r = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), subName }),
      })
      if (!r.ok) return alert('Falha ao criar cidade.')
      location.reload()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="rounded bg-blue-600 px-3 py-1.5 text-white"
    >
      Nova cidade
    </button>
  )
}

export function CityRowActions({ city }: { city: City }) {
  const [pending, start] = useTransition()

  const rename = () => {
    const name = prompt('Novo nome da cidade:', city.name)
    if (!name) return
    const subName = prompt('Nova subopção (opcional):', city.subName || '') || null

    start(async () => {
      const r = await fetch('/api/admin/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: city.id, name: name.trim(), subName }),
      })
      if (!r.ok) return alert('Falha ao renomear.')
      location.reload()
    })
  }

  const toggle = () =>
    start(async () => {
      const r = await fetch('/api/admin/cities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: city.id, active: !city.active }),
      })
      if (!r.ok) return alert('Falha ao alterar status.')
      location.reload()
    })

  return (
    <div className="flex gap-2">
      <button
        onClick={rename}
        disabled={pending}
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Renomear
      </button>
      <button
        onClick={toggle}
        disabled={pending}
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        {city.active ? 'Inativar' : 'Ativar'}
      </button>
    </div>
  )
}
