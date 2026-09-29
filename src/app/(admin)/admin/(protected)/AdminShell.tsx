'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { logoutAction } from './actions'

interface NavLink {
  href: string
  label: string
}

const CONTENT_LINKS: NavLink[] = [
  { href: '/admin/shows', label: 'Agenda' },
  { href: '/admin/gallery', label: 'Galeria' },
  { href: '/admin/media', label: 'Biblioteca de mídia' },
  { href: '/admin/releases', label: 'Música' },
  { href: '/admin/press', label: 'Imprensa' },
  { href: '/admin/career', label: 'Carreira' },
  { href: '/admin/homepage', label: 'Página inicial' },
]

const SETTINGS_LINKS: NavLink[] = [
  { href: '/admin/booking', label: 'Booking' },
  { href: '/admin/seo', label: 'SEO' },
  { href: '/admin/settings', label: 'Ajustes' },
]

const MOBILE_PRIMARY: NavLink[] = [
  { href: '/admin', label: 'Início' },
  { href: '/admin/shows', label: 'Agenda' },
  { href: '/admin/gallery', label: 'Galeria' },
]

function NavGroup({
  title,
  links,
  pathname,
}: {
  title?: string
  links: NavLink[]
  pathname: string
}) {
  return (
    <div className='mt-6 first:mt-0'>
      {title && (
        <p className='px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400'>
          {title}
        </p>
      )}
      <ul className='mt-2 space-y-0.5'>
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'border-l-2 border-[var(--accent)] bg-neutral-100 font-medium text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AdminShell({
  children,
  userName,
}: {
  children: ReactNode
  userName: string
}) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  return (
    <div className='flex min-h-screen'>
      {/* Desktop sidebar */}
      <aside className='hidden w-62 shrink-0 border-r border-neutral-200 bg-white px-3 py-5 lg:block'>
        <Link
          href='/admin'
          className='block px-3 text-sm font-semibold tracking-tight text-neutral-900'
        >
          Modern <span className='font-normal text-neutral-400'>· CMS</span>
        </Link>

        <nav className='mt-8'>
          <NavGroup
            links={[{ href: '/admin', label: 'Dashboard' }]}
            pathname={pathname}
          />
          <NavGroup
            title='Conteúdo'
            links={CONTENT_LINKS}
            pathname={pathname}
          />
          <NavGroup
            title='Configurações'
            links={SETTINGS_LINKS}
            pathname={pathname}
          />
        </nav>

        <div className='mt-8 border-t border-neutral-200 px-3 pt-4'>
          <p className='truncate text-xs text-neutral-500'>{userName}</p>
          <form action={logoutAction}>
            <button
              type='submit'
              className='mt-2 text-xs text-neutral-500 underline hover:text-neutral-900'
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className='flex min-h-screen flex-1 flex-col'>
        <main className='flex-1 pb-20 lg:pb-0'>{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className='fixed inset-x-0 bottom-0 z-50 flex border-t border-neutral-200 bg-white lg:hidden'>
        {MOBILE_PRIMARY.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 py-3 text-center text-xs ${active ? 'font-medium text-neutral-900' : 'text-neutral-500'}`}
            >
              {link.label}
            </Link>
          )
        })}
        <button
          onClick={() => setIsMoreOpen(true)}
          className='flex-1 py-3 text-center text-xs text-neutral-500'
        >
          Mais
        </button>
      </nav>

      {isMoreOpen && (
        <div className='fixed inset-0 z-50 flex flex-col bg-white lg:hidden'>
          <div className='flex items-center justify-between border-b border-neutral-200 px-4 py-4'>
            <p className='text-sm font-medium'>Mais</p>
            <button
              onClick={() => setIsMoreOpen(false)}
              aria-label='Fechar'
              className='text-neutral-500'
            >
              Fechar
            </button>
          </div>
          <div
            className='flex-1 overflow-y-auto px-3 py-4'
            onClick={() => setIsMoreOpen(false)}
          >
            <NavGroup
              title='Conteúdo'
              links={CONTENT_LINKS}
              pathname={pathname}
            />
            <NavGroup
              title='Configurações'
              links={SETTINGS_LINKS}
              pathname={pathname}
            />
          </div>
          <div className='border-t border-neutral-200 p-4'>
            <form action={logoutAction}>
              <button
                type='submit'
                className='text-sm text-neutral-600 underline'
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
