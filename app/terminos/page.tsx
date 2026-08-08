'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'

export default function TerminosPage() {
  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      
      <main className="min-h-screen bg-deep py-32">
        <div className="container mx-auto px-5 lg:px-10 max-w-4xl">
          <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl mb-8">
            Términos y Condiciones
          </h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p>
              Bienvenido a GMX Gaming. Al acceder a este sitio web asumimos que aceptas estos términos y condiciones en su totalidad. No continúes utilizando el sitio web de GMX Gaming si no aceptas todos los términos y condiciones establecidos en esta página.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">Uso de la Plataforma</h2>
            <p>
              Como usuario de nuestra plataforma, te comprometes a usar nuestros servicios únicamente para fines legales, y de manera que no infrinja los derechos de, restrinja o inhiba el uso y disfrute de la plataforma por parte de terceros.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">Registro en Torneos</h2>
            <p>
              Al registrarte en nuestros torneos, aceptas cumplir con los reglamentos específicos de cada competencia. GMX Gaming se reserva el derecho de admitir o descalificar equipos basándose en el cumplimiento de las normas de la comunidad.
            </p>
            <p className="mt-8 text-sm opacity-50">Última actualización: Agosto 2024</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
