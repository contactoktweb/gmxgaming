'use client'

import { useMemo } from 'react'
import { MapPin, User, MessageCircle, Gamepad2, Mic, Users, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export function ContactDirectory() {
  const { t } = useLanguage()

  const DIRECTORY_DATA = useMemo(() => [
    {
      id: 'ligas',
      title: t.contactDirectory.leaguesTitle,
      icon: <Gamepad2 className="h-6 w-6 text-primary" />,
      items: [
        { label: t.contactDirectory.countryLabel, value: t.contactDirectory.allCountries, icon: <MapPin className="h-4 w-4" /> },
        { label: t.contactDirectory.responsibleLabel, value: 'Mordon', icon: <User className="h-4 w-4" /> },
        { 
          label: t.contactDirectory.contactMethodLabel, 
          value: 'Discord', 
          link: 'http://discordapp.com/users/510623536843587605',
          contactId: 'mordongmx',
          icon: <MessageCircle className="h-4 w-4" /> 
        },
      ]
    },
    {
      id: 'caster',
      title: t.contactDirectory.casterTitle,
      icon: <Mic className="h-6 w-6 text-primary" />,
      items: [
        { label: t.contactDirectory.responsibleLabel, value: 'Beba', icon: <User className="h-4 w-4" /> },
        { 
          label: t.contactDirectory.contactMethodLabel, 
          value: 'Discord', 
          link: 'http://discordapp.com/users/895824911749234748',
          contactId: 'kepler3',
          icon: <MessageCircle className="h-4 w-4" /> 
        },
      ]
    },
    {
      id: 'equipos',
      title: t.contactDirectory.teamsTitle,
      icon: <Users className="h-6 w-6 text-primary" />,
      items: [
        { label: t.contactDirectory.teamLabel, value: 'GMX Gaming', icon: <Users className="h-4 w-4" /> },
        { label: t.contactDirectory.responsibleLabel, value: 'Mordon', icon: <User className="h-4 w-4" /> },
        { 
          label: t.contactDirectory.contactMethodLabel, 
          value: 'Discord', 
          link: 'http://discordapp.com/users/510623536843587605',
          contactId: 'mordongmx',
          icon: <MessageCircle className="h-4 w-4" /> 
        },
      ]
    }
  ], [t])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-700 uppercase tracking-tight text-white">
          {t.contactDirectory.title}
        </h2>
        <p className="text-muted-foreground">
          {t.contactDirectory.subtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {DIRECTORY_DATA.map((section) => (
          <div 
            key={section.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="relative z-10 flex flex-col h-full gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                  {section.icon}
                </div>
                <h3 className="font-display text-lg font-600 uppercase tracking-tight text-white pt-1">
                  {section.title}
                </h3>
              </div>

              <div className="flex flex-col gap-4 mt-auto border-t border-border/50 pt-4">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {item.icon}
                      <span className="text-xs font-600 uppercase tracking-wider">{item.label}</span>
                    </div>
                    
                    {item.link ? (
                      <div className="flex flex-col items-end">
                        <a 
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm font-500 text-primary hover:text-primary-dark transition-colors"
                        >
                          {item.value}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {item.contactId && (
                          <span className="text-xs text-muted-foreground mt-0.5 font-mono">
                            @{item.contactId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-500 text-white text-right">
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
