// src/app/admin/usuarios/_buttons.tsx
'use client'

import { useTransition } from 'react'

type UserRow = {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEDICO'
  allowedCitiesCsv?: string | null
}

export function NewUserButton() {
  const [pending, start] = useTransition()

  const onClick = () => {
    const name = prompt('Nome do usuário:')
    if (name === null) return
    const email = prompt('Email do usuário:')
    if (email === null) return
    const role = (prompt('Perfil (ADMIN ou MEDICO):', 'MEDICO') || 'MEDICO').toUpperCase()

    start(async () => {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      })
      if (!r.ok) return alert('Falha ao criar usuário.')
      location.reload()
    })
  }

  return (
    <button
      className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
    >
      Novo usuário
    </button>
  )
}

export function EditUserButton({ user }: { user: UserRow }) {
  const [pending, start] = useTransition()

  const onClick = () => {
    const name = prompt('Nome:', user.name || '')
    if (name === null) return
    const role = (prompt('Perfil (ADMIN ou MEDICO):', user.role) || user.role).toUpperCase()
    // CSV mostrado serve apenas para visualização, cidades são geridas na tela de cidades/edição detalhada
    start(async () => {
      const r = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: name.trim(),
          role,
        }),
      })
      if (!r.ok) return alert('Falha ao editar usuário.')
      location.reload()
    })
  }

  return (
    <button
      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
    >
      Editar
    </button>
  )
}

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition()
  const onClick = () => {
    if (!confirm('Resetar senha deste usuário?')) return
    start(async () => {
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'reset_password' }),
      })
      if (!r.ok) return alert('Falha ao resetar senha.')
      alert('Senha resetada (verifique a política definida no backend).')
    })
  }
  return (
    <button
      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
    >
      Resetar senha
    </button>
  )
}

export function DeleteUserButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition()
  const onClick = () => {
    if (!confirm('Excluir este usuário?')) return
    start(async () => {
      const r = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })
      if (!r.ok) return alert('Falha ao excluir usuário.')
      location.reload()
    })
  }
  return (
    <button
      className="rounded border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
    >
      Excluir
    </button>
  )
}
