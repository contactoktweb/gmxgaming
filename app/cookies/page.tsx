'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'

export default function CookiesPage() {
  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      
      <main className="min-h-screen bg-deep py-32">
        <div className="container mx-auto px-5 lg:px-10 max-w-4xl">
          <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl mb-8">
            Uso de Cookies
          </h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p>
              Nuestro sitio web utiliza cookies para distinguirte de otros usuarios. Esto nos ayuda a proporcionarte una buena experiencia al navegar y también nos permite mejorar nuestra plataforma.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">¿Qué son las Cookies?</h2>
            <p>
              Una cookie es un pequeño archivo de letras y números que almacenamos en tu navegador o en el disco duro de tu computadora si estás de acuerdo. Las cookies contienen información que se transfiere al disco duro de tu computadora.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">Tipos de Cookies que Usamos</h2>
            <p>
              Utilizamos cookies estrictamente necesarias (requeridas para el funcionamiento del sitio, como el inicio de sesión) y cookies analíticas (para reconocer y contar el número de visitantes y ver cómo se mueven por el sitio).
            </p>
            <p className="mt-8 text-sm opacity-50">Última actualización: Agosto 2024</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
