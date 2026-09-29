import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/admin')

  const { callbackUrl } = await searchParams

  return (
    <div className='flex min-h-screen items-center justify-center px-6'>
      <div className='w-full max-w-[380px]'>
        <div className='mb-8 text-center'>
          <p className='text-lg font-semibold tracking-tight text-neutral-900'>
            Modern
          </p>
          <p className='mt-1 text-sm text-neutral-500'>Modern CMS</p>
        </div>
        <div className='rounded-lg border border-neutral-200 bg-white p-8 shadow-sm'>
          <LoginForm
            callbackUrl={
              callbackUrl && callbackUrl.startsWith('/admin')
                ? callbackUrl
                : '/admin'
            }
          />
        </div>
      </div>
    </div>
  )
}
