import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener la sesión actual
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas de /registro (Altas) y /micuenta
  const isRestricted = request.nextUrl.pathname.startsWith('/registro') || request.nextUrl.pathname.startsWith('/micuenta')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/crear-cuenta')

  // Si no hay usuario y trata de entrar a rutas restringidas
  if (isRestricted && !user) {
    const redirectRes = NextResponse.redirect(new URL('/login', request.url))
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectRes.cookies.set(name, value, options)
    })
    return redirectRes
  }

  // Si ya hay usuario y trata de ir al login, enviarlo a su cuenta
  if (isAuthRoute && user) {
    const redirectRes = NextResponse.redirect(new URL('/micuenta', request.url))
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectRes.cookies.set(name, value, options)
    })
    return redirectRes
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (OAuth/email callbacks — must pass through without middleware interference)
     * - images, logos, etc (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|logos|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
