'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthBadge() {
  const { data, status } = useSession()
  const firstName = (data?.user?.name || '').split(' ')[0]

  if (status === 'loading') return <span className="text-sm text-gray-500">...</span>

  if (data?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">Olá, <strong>{firstName}</strong></span>
        <button
          onClick={() => signOut()}
          className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn()}
      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
    >
      Login
    </button>
  )
}
