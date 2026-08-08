'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/sections/site-footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CustomCursor } from '@/components/custom-cursor'

export default function PrivacidadPage() {
  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      
      <main className="min-h-screen bg-deep py-32">
        <div className="container mx-auto px-5 lg:px-10 max-w-4xl">
          <h1 className="font-display text-4xl font-700 uppercase tracking-tight text-white sm:text-5xl mb-8">
            Política de Privacidad
          </h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p>
              En GMX Gaming, nos comprometemos a proteger y respetar tu privacidad. Esta política establece las bases sobre las cuales procesaremos cualquier dato personal que recopilemos de ti o que nos proporciones.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">Recopilación de Información</h2>
            <p>
              Podemos recopilar y procesar la siguiente información sobre ti: 
              información que proporcionas al rellenar formularios en nuestro sitio, 
              registros de correspondencia si nos contactas y detalles de tus visitas a nuestro sitio web.
            </p>
            <h2 className="text-white font-display uppercase tracking-widest mt-8 mb-4">Uso de la Información</h2>
            <p>
              Utilizamos la información almacenada sobre ti de las siguientes formas: 
              para garantizar que el contenido de nuestro sitio se presente de la manera más efectiva para ti, 
              para proporcionarte información, productos o servicios que nos solicites, 
              y para notificarte sobre cambios en nuestro servicio.
            </p>
            <p className="mt-8 text-sm opacity-50">Última actualización: Agosto 2024</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
