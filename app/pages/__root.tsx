/// <reference types="vite/client" />

import '../index.css'

import type { ReactNode } from 'react'
import { Outlet, createRootRoute, HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
  }),
  component: RootComponent,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isGuestPage = pathname === '/' || pathname.startsWith('/legal')

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <div className='flex flex-col min-h-dvh'>
          {isGuestPage ? (
            <>
              <Navbar />
              <main className='flex flex-1 flex-col'>
                <Outlet />
              </main>
              <Footer className='py-4 mx-auto' />
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='de-DE'>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
