import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ({ error }) => (
    <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-slate-100">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-neutral-dark mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-6">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg w-full transition-colors cursor-pointer"
        >
          Reload Page
        </button>
      </div>
    </div>
  ),
})
