export const NAV_LINKS = [
  { label: 'INICIO', href: '/#hero' },
  { 
    label: 'REGISTRO ESPORTS', 
    href: '#registro',
    submenu: [
      { label: 'ALTA DE EQUIPO', href: '/registro/alta-de-equipo' },
      { label: 'ALTA DE JUGADOR', href: '/registro/alta-de-jugador' },
      { label: 'ALTA DE CONTRATO', href: '/registro/alta-de-contrato' }
    ]
  },
  { label: 'EQUIPOS AFILIADOS', href: '/equipos' },
  { label: 'TORNEOS', href: '/torneos' },
]


export const SOCIALS = [
  { label: 'Twitch', href: 'https://twitch.tv/', short: 'TW' },
  { label: 'YouTube', href: 'https://youtube.com/', short: 'YT' },
  { label: 'Instagram', href: 'https://instagram.com/', short: 'IG' },
  { label: 'Discord', href: 'https://discord.com/', short: 'DC' },
  { label: 'TikTok', href: 'https://tiktok.com/', short: 'TK' },
]

export const BENEFITS = [
  {
    n: '01',
    title: 'TORNEOS COMPETITIVOS',
    desc: 'Compite en ligas y brackets de alto nivel con premios reales cada temporada.',
    accent: true,
  },
  {
    n: '02',
    title: 'EXPOSICIÓN INTERNACIONAL',
    desc: 'Muestra tu talento ante una audiencia global y equipos profesionales.',
    accent: false,
  },
  {
    n: '03',
    title: 'COMUNIDAD ESPORTS',
    desc: 'Únete a miles de jugadores apasionados que viven la competencia.',
    accent: false,
  },
  {
    n: '04',
    title: 'CRECIMIENTO PROFESIONAL',
    desc: 'Da el salto del gaming amateur al circuito profesional de eSports.',
    accent: true,
  },
]

export const PLAYERS = [
  { name: 'Tamaal', team: 'ARTAUD', game: 'MOBILE LEGENDS', img: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/08/TamaalGMX1.png?fit=300%2C300&ssl=1' },
  { name: 'Jose Jose', team: 'HYPE TEAM', game: 'MOBILE LEGENDS', img: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/08/JoseJoseGMX.png?fit=300%2C300&ssl=1' },
  { name: 'Sinner', team: 'STARBOYS', game: 'MOBILE LEGENDS', img: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/2024/08/SinnerGMX.png?fit=300%2C300&ssl=1' },
  { name: 'Stark', team: 'TEAM LIMIT', game: 'MOBILE LEGENDS', img: '/images/player-4.png' },
  { name: 'Shinnys', team: 'SINERGY', game: 'MOBILE LEGENDS', img: '/images/player-5.png' },
  { name: 'Caballo', team: 'E-STAR GAMING', game: 'MOBILE LEGENDS', img: '/images/player-6.png' },
]

export const GMX_BENEFITS = [
  { n: '01', title: 'EXPOSICIÓN INTERNACIONAL' },
  { n: '02', title: 'TORNEOS GLOBALES' },
  { n: '03', title: 'EVENTOS PRESENCIALES' },
  { n: '04', title: 'RECONOCIMIENTO ESPORTS' },
  { n: '05', title: 'RECOMPENSAS EXCLUSIVAS' },
  { n: '06', title: 'NETWORKING GAMER' },
  { n: '07', title: 'MEJORA COMPETITIVA' },
  { n: '08', title: 'OPORTUNIDADES PROFESIONALES' },
]

export const TEAMS = [
  { 
    name: 'GMX ESPORTS', 
    game: 'MULTI GAMING',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/WhatsApp-Image-2026-02-21-at-2.17.16-PM.jpeg?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/'
  },
  { 
    name: 'Sinergy', 
    game: 'ESPORTS',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/1000252639.jpg?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/nebula/'
  },
  { 
    name: 'TEAM QUETZAL KING', 
    game: 'ESPORTS',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/Team-Quetzal-King.png?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/'
  },
  { 
    name: 'THE HUNGRY KINGS', 
    game: 'ESPORTS',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/1756832417680.png?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/'
  },
  { 
    name: 'U2 STAR', 
    game: 'ESPORTS',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/1000248747.png?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/'
  },
  { 
    name: 'VOID ESPORTS MX', 
    game: 'ESPORTS',
    logo: 'https://i0.wp.com/gmxgaming.com/wp-content/uploads/formidable/13/PDF_Logo_VOID-1_page-0001-scaled.png?resize=150%2C150&ssl=1',
    link: 'https://gmxgaming.com/'
  },
]

export const PARTNERS = [
  'FED. MX ESPORTS',
  'KINGS CLASH',
  'HYPERPLAY',
  'NEXUS LEAGUE',
  'REDBYTE',
  'ARENA PRO',
  'VOLT GG',
  'TITAN CUP',
]

export const TOURNAMENTS = [
  {
    category: 'GMX KINGS CLASH',
    date: 'JULIO 2024',
    title: 'GMX KINGS CLASH: LA GRAN FINAL',
    desc: 'Los ocho mejores equipos de la región se enfrentan por el título y la gloria.',
    img: '/images/tournament-1.png',
  },
  {
    category: 'HONOR OF KINGS',
    date: 'JULIO 2024',
    title: 'CLASIFICATORIAS HONOR OF KINGS',
    desc: 'Abrimos las puertas a nuevos talentos en la clasificatoria abierta de la temporada.',
    img: '/images/tournament-2.png',
  },
  {
    category: 'TORNEOS',
    date: 'JULIO 2024',
    title: 'GMX SUMMER SHOWDOWN 2024',
    desc: 'Un evento presencial de talla mundial con premios exclusivos y show en vivo.',
    img: '/images/tournament-3.png',
  },
]
