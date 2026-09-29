'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { logoutAction } from './actions'
import {
  ADMIN_MOBILE_PRIMARY,
  visibleNav,
  type AdminNavGroup,
  type AdminNavLink,
} from '@/lib/admin/nav'
import type { Role } from '@/lib/auth/guards'

const isActive = (pathname: string, href: string) =>
  href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)

function NavGroup({
  group,
  pathname,
}: {
  group: AdminNavGroup
  pathname: string
}) {
  return (
    <div className='mt-6 first:mt-0'>
      {group.title && (
        <p className='px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400'>
          {group.title}
        </p>
      )}
      <ul className='mt-2 space-y-0.5'>
        {group.links.map((link: AdminNavLink) => {
          const active = isActive(pathname, link.href)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-neutral-900 font-medium text-white'
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

/** Modern = the platform; brandName = the site being managed. */
function Wordmark({ brandName }: { brandName: string }) {
  return (
    <Link href='/admin' className='block px-3'>
      <span className='block text-sm font-semibold tracking-tight text-neutral-900'>
        Modern <span className='font-normal text-neutral-400'>CMS</span>
      </span>
      <span className='mt-0.5 block truncate text-xs text-neutral-500'>
        {brandName}
      </span>
    </Link>
  )
}

export function AdminShell({
  children,
  userName,
  role,
  brandName,
}: {
  children: ReactNode
  userName: string
  role: Role
  brandName: string
}) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const groups = visibleNav(role)

  return (
    <div className='flex min-h-screen'>
      {/* Desktop sidebar */}
      <aside className='sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white py-5 lg:flex'>
        <div className='px-3'>
          <Wordmark brandName={brandName} />
        </div>

        <nav aria-label='Admin' className='mt-6 flex-1 overflow-y-auto px-3'>
          {groups.map((group) => (
            <NavGroup
              key={group.title ?? 'root'}
              group={group}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className='mx-3 mt-4 border-t border-neutral-200 px-3 pt-4'>
          <p className='truncate text-xs text-neutral-500'>{userName}</p>
          <div className='mt-2 flex items-center gap-3 text-xs'>
            <Link
              href='/'
              target='_blank'
              className='text-neutral-500 underline hover:text-neutral-900'
            >
              Ver site
            </Link>
            <form action={logoutAction}>
              <button
                type='submit'
                className='text-neutral-500 underline hover:text-neutral-900'
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className='flex min-h-screen min-w-0 flex-1 flex-col'>
        {/* Mobile top bar */}
        <header className='flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden'>
          <Wordmark brandName={brandName} />
        </header>
        <main className='flex-1 pb-20 lg:pb-0'>{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label='Atalhos'
        className='fixed inset-x-0 bottom-0 z-50 flex border-t border-neutral-200 bg-white lg:hidden'
      >
        {ADMIN_MOBILE_PRIMARY.map((link) => {
          const active = isActive(pathname, link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 py-3 text-center text-xs ${active ? 'font-medium text-neutral-900' : 'text-neutral-500'}`}
            >
              {link.label}
            </Link>
          )
        })}
        <button
          onClick={() => setIsMoreOpen(true)}
          aria-expanded={isMoreOpen}
          className='flex-1 py-3 text-center text-xs text-neutral-500'
        >
          Mais
        </button>
      </nav>

      {isMoreOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Menu'
          className='fixed inset-0 z-50 flex flex-col bg-white lg:hidden'
        >
          <div className='flex items-center justify-between border-b border-neutral-200 px-4 py-4'>
            <p className='text-sm font-medium'>Menu</p>
            <button
              onClick={() => setIsMoreOpen(false)}
              className='text-sm text-neutral-500'
            >
              Fechar
            </button>
          </div>
          <div
            className='flex-1 overflow-y-auto px-3 py-4'
            onClick={() => setIsMoreOpen(false)}
          >
            {groups.map((group) => (
              <NavGroup
                key={group.title ?? 'root'}
                group={group}
                pathname={pathname}
              />
            ))}
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
