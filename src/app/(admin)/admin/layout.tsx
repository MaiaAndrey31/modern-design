import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: { default: 'Modern CMS', template: '%s — Modern CMS' },
  robots: { index: false, follow: false },
}

/**
 * Owns the admin's own light, plain theme — deliberately not the public
 * site's dark cinematic look (see the UX spec: the panel is a tool, not
 * "more of the show"). No GSAP/Lenis/Three.js/CustomCursor import anywhere
 * in this tree, so none of that JS ships to admin users.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div lang='pt-BR' className='min-h-full bg-neutral-50 text-neutral-900'>
      {children}
    </div>
  )
}
