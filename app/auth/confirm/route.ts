import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function handleAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/micuenta'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv ? origin : (forwardedHost ? `${forwardedProto}://${forwardedHost}` : (process.env.NEXT_PUBLIC_SITE_URL || origin))

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // 1. Si el proveedor (Google) o Supabase retornó un error directo
  if (errorParam) {
    console.error('[auth] Error recibido de OAuth:', errorParam, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorDescription || errorParam)}`
    )
  }

  // 2. Manejo de OAuth PKCE callback en el servidor (?code=...)
  if (code) {
    try {
      const cookieStore = await cookies()
      const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`)

      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options)
                } catch {}
                redirectResponse.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data?.user) {
        const user = data.user
        const metadata = user.user_metadata || {}
        const fullName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Usuario'
        const avatarUrl = metadata.avatar_url || metadata.picture || null

        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', user.id)
            .single()

          if (!existingProfile) {
            await supabase.from('profiles').upsert({
              id: user.id,
              name: fullName,
              avatar_url: avatarUrl,
              role: 'user',
              is_player: false,
              player_status: 'none'
            })
          } else if ((!existingProfile.name && fullName) || (!existingProfile.avatar_url && avatarUrl)) {
            const updates: Record<string, any> = {}
            if (!existingProfile.name && fullName) updates.name = fullName
            if (!existingProfile.avatar_url && avatarUrl) updates.avatar_url = avatarUrl
            await supabase.from('profiles').update(updates).eq('id', user.id)
          }
        } catch (profileErr) {
          console.error('[auth] Error al sincronizar el perfil de Google en servidor:', profileErr)
        }

        return redirectResponse
      }

      // Si el servidor no pudo hacer el exchange (ej: verifier de PKCE en storage del cliente),
      // NO enviamos error al usuario, pasamos al fallback del cliente donde el navegador
      // sí tiene acceso directo a document.cookie y localStorage.
      console.warn('[auth] Exchange en servidor no completó, ejecutando fallback en cliente:', error?.message)
    } catch (serverErr) {
      console.warn('[auth] Error inesperado en exchange de servidor, ejecutando fallback:', serverErr)
    }
  }

  // 3. Manejo de magic link / OTP (token_hash)
  if (token_hash && type) {
    try {
      const cookieStore = await cookies()
      const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`)

      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options)
                } catch {}
                redirectResponse.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!error) {
        return redirectResponse
      }
      console.error('[auth] Error en verifyOtp:', error)
    } catch (otpErr) {
      console.error('[auth] Error inesperado en verifyOtp:', otpErr)
    }
  }

  // 4. Fallback interactivo en cliente:
  // Procesa el código PKCE con los datos locales del navegador o recupera tokens en el hash (#access_token=...)
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iniciando Sesión - GMX Gaming</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #08080c;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      text-align: center;
      padding: 2.5rem;
      border-radius: 1rem;
      background: #111116;
      border: 1px solid rgba(255,255,255,0.1);
      max-width: 380px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 1.5rem;
      border: 3px solid rgba(255, 70, 85, 0.2);
      border-top-color: #ff4655;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    p {
      margin: 0;
      font-size: 0.875rem;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Iniciando Sesión</h2>
    <p>Conectando con tu cuenta de Google...</p>
  </div>
  <script>
    (async function() {
      try {
        const client = window.supabase.createClient("${supabaseUrl}", "${supabaseKey}", {
          auth: {
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        });

        async function syncProfile(user) {
          if (!user) return;
          const meta = user.user_metadata || {};
          const fullName = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Usuario');
          const avatarUrl = meta.avatar_url || meta.picture || null;
          
          try {
            await client.from('profiles').upsert({
              id: user.id,
              name: fullName,
              avatar_url: avatarUrl,
              role: 'user',
              is_player: false,
              player_status: 'none'
            });
          } catch(e) {
            console.error('Error syncing profile:', e);
          }
        }

        // 1. Si hay código en los search params del navegador
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code') || "${code || ''}";

        if (code) {
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (!error && data && data.user) {
            await syncProfile(data.user);
            window.location.href = "${baseUrl}${next}";
            return;
          }
        }

        // 2. Comprobar si ya existe la sesión en storage o en el hash fragment
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
          await syncProfile(session.user);
          window.location.href = "${baseUrl}${next}";
          return;
        }

        // 3. Suscribirse a cambios de autenticación
        client.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            await syncProfile(session.user);
            window.location.href = "${baseUrl}${next}";
          }
        });

        // 4. Redirigir después de breve tiempo si no se detecta nada
        setTimeout(() => {
          window.location.href = "${baseUrl}${next}";
        }, 2000);

      } catch (err) {
        console.error('Callback error:', err);
        window.location.href = "${baseUrl}${next}";
      }
    })();
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request)
}
