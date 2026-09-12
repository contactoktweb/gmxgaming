export type Language = 'es' | 'en'

export const translations = {
  es: {
    // Navigation
    nav: {
      home: 'INICIO',
      esportsRegistration: 'REGISTRO ESPORTS',
      registerTeam: 'ALTA DE EQUIPO',
      registerPlayer: 'ALTA DE JUGADOR',
      registerContract: 'ALTA DE CONTRATO',
      affiliatedTeams: 'EQUIPOS AFILIADOS',
      tournaments: 'TORNEOS',
      media: 'Media / GMX TV',
      featuredPlayers: 'Jugadores Destacados',
      ourCasters: 'Nuestros Casters',
      beACaster: 'Sé un Caster',
      discord: 'Discord',
    },

    // Header & User Actions
    header: {
      searchPlaceholder: 'Buscar...',
      searchModalPlaceholder: 'Busca jugadores por nickname, equipos o torneos...',
      searchMinChars: 'Escribe al menos 2 caracteres...',
      searchNoResults: 'No se encontraron resultados para',
      searchTypePlayer: 'Jugador',
      searchTypeTeam: 'Equipo',
      searchTypeTournament: 'Torneo',
      myAccount: 'MI CUENTA',
      administration: 'ADMINISTRACIÓN',
      login: 'INGRESAR',
      createUser: 'CREA TU USUARIO',
      logout: 'SALIR',
      languageLabel: 'Idioma',
      logoutModalTitle: '¿Cerrar Sesión?',
      logoutModalDesc: 'Estás a punto de salir de tu cuenta en GMX Gaming. ¿Deseas continuar?',
      cancel: 'Cancelar',
      confirmLogout: 'Sí, Salir',
      restrictedAccess: 'Acceso Restringido',
      restrictedLoginDesc: 'Debes iniciar sesión para realizar altas o registros en la plataforma.',
      restrictedPlayerDesc: 'Debes ser un Jugador Profesional Aprobado para registrar un contrato.',
      viewMyAccount: 'Ver Mi Cuenta',
      followUs: 'Síguenos',
    },

    // Hero Section
    hero: {
      hudEst: 'EST. 2024',
      hudSubtitle: 'GMX GAMING / ESPORTS / COMPETITION',
      hudCompete: '01 / COMPITE',
      hudGrow: '02 / CRECE',
      hudDominate: '03 / DOMINA',
      welcomeBadge: '¡BIENVENIDOS A GMX GAMING!',
      titleWords: ['AQUÍ', 'COMIENZA', 'EL', 'CAMINO'],
      subtitle: 'CONVIÉRTETE EN JUGADOR PROFESIONAL DE ESPORTS',
      description: 'Compite, crece y demuestra tu nivel dentro de una comunidad creada para llevar el talento gamer al siguiente nivel.',
      goToProfile: 'IR A TU PERFIL',
      createUserBtn: 'CREA TU USUARIO',
      exploreTournaments: 'EXPLORA LOS TORNEOS',
      scrollIndicator: 'DESLIZA PARA EXPLORAR',
      ticker: ['LIGAS', 'TORNEOS', 'EVENTOS', 'MOBILE LEGENDS', 'HONOR OF KINGS', 'ESPORTS'],
    },

    // About Section
    about: {
      badge: '¿Por qué registrarte?',
      title1: 'SUPERA',
      title2: 'TUS LÍMITES',
      description: '¡Aquí comienza tu aventura épica en el mundo gamer! Únete a una comunidad apasionada y vive la emoción de torneos electrizantes, competencias de alto nivel y eventos únicos que te conectan con jugadores de todo el mundo. Ya seas un principiante o un experto, GMX Gaming te ofrece la oportunidad de demostrar tus habilidades, ganar premios increíbles y formar parte de una revolución gaming sin igual. ¡Regístrate hoy y descubre un universo donde cada partida cuenta y la diversión no tiene límites!',
      playersCount: '+100',
      playersLabel: 'Jugadores',
      benefits: [
        {
          n: '01',
          title: 'TORNEOS COMPETITIVOS',
          desc: 'Compite en ligas y brackets de alto nivel con premios reales cada temporada.',
        },
        {
          n: '02',
          title: 'EXPOSICIÓN INTERNACIONAL',
          desc: 'Muestra tu talento ante una audiencia global y equipos profesionales.',
        },
        {
          n: '03',
          title: 'COMUNIDAD ESPORTS',
          desc: 'Únete a miles de jugadores apasionados que viven la competencia.',
        },
        {
          n: '04',
          title: 'CRECIMIENTO PROFESIONAL',
          desc: 'Da el salto del gaming amateur al circuito profesional de eSports.',
        },
      ],
    },

    // Marquee Bands
    marquee: {
      line1: ['GMX GAMING', 'AQUÍ COMIENZA EL CAMINO', 'SUPERA TUS LÍMITES', 'COMPITE. CRECE. DOMINA.'],
      line2: ['TORNEOS DE ESPORTS', 'MOBILE LEGENDS', 'COMPETENCIA DE ALTO NIVEL', 'CONVIÉRTETE EN UNA ESTRELLA'],
    },

    // Tournaments Section
    tournaments: {
      badge: 'Lo último de la escena',
      title1: 'ÚLTIMOS TORNEOS',
      title2: 'Y NOTICIAS',
      viewAll: 'Ver Todos los Torneos',
      readMore: 'Leer más',
      upcoming: 'Próximamente',
      officialTournament: 'Torneo Oficial',
      defaultDesc: 'Torneo oficial de Mobile Legends. Los mejores equipos compiten por el título y la gloria.',
      noTournamentsRegistered: 'No hay torneos registrados',
      noTournamentsDesc: 'Los próximos torneos aparecerán aquí automáticamente.',
      ongoingSection: 'En Curso',
      upcomingSection: 'Próximos Torneos',
      pastSection: 'Torneos Pasados',
      viewBracket: 'Ver Brackets y Partidos',
      teamsCount: 'Equipos',
      prize: 'Premio',
      dateTbd: 'Por Definir',
      backToTournaments: 'Volver a Torneos',
      tournamentNotFound: 'Torneo no encontrado',
      tournamentNotFoundDesc: 'El torneo que buscas no existe o ha sido eliminado.',
      registerForTournament: 'INSCRIBIRME AL TORNEO',
      tabsMatches: 'Partidos & Brackets',
      tabsTeams: 'Equipos Participantes',
      tabsRules: 'Reglas & Premios',
      rulesTitle: 'Reglamento Oficial',
      rulesDesc: 'Todos los equipos deben cumplir con las normativas oficiales de GMX Gaming y presentarse 15 minutos antes de cada encuentro.',
      prizepoolTitle: 'Bolsa de Premios',
      prizepoolDesc: 'Distribución oficial para los primeros lugares del certamen.',
      noMatchesYet: 'No hay partidos programados todavía en este torneo.',
      noTeamsYet: 'Aún no hay equipos inscritos en este torneo.',
      matchLive: 'En Vivo',
      matchFinished: 'Finalizado',
      matchScheduled: 'Programado',
    },

    // Teams Section
    teams: {
      badge: 'La élite compite con nosotros',
      title: 'EQUIPOS AFILIADOS',
      pageTitle: 'Equipos Afiliados',
      pageDesc: 'Conoce a las organizaciones y escuadras profesionales que forman parte del ecosistema competitivo de GMX Gaming.',
      searchPlaceholder: 'Buscar equipo...',
      noTeamsTitle: 'No hay equipos afiliados',
      noTeamsDesc: 'Actualmente no contamos con equipos registrados en la plataforma. ¡Sé el primero en afiliar a tu organización!',
      registerTeamBtn: 'Registrar Equipo',
      noTeamsFoundSearch: 'No se encontraron equipos que coincidan con la búsqueda.',
      viewProfile: 'Ver Perfil',
      unknownCountry: 'Desconocido',
      officialAffiliatedTeam: 'Equipo Afiliado Oficial',
      officialManager: 'Manager Oficial',
      noManagerAssigned: 'Sin manager asignado',
      activeRoster: 'Roster Activo',
      rosterSectionTitle: 'Roster Actual',
      noPlayersInRoster: 'Este equipo aún no cuenta con jugadores confirmados en su plantilla activa.',
      matchHistory: 'Historial de Partidos',
      noMatchHistory: 'Este equipo aún no ha disputado partidos registrados en la plataforma.',
      tournamentsPlayed: 'Torneos Disputados',
      victories: 'Victorias',
      members: 'Miembros',
      teamNotFound: 'Equipo no encontrado',
      teamNotFoundDesc: 'El equipo que buscas no existe o ha sido desactivado.',
      backToTeams: 'Volver a Equipos',
      countryLabel: 'País',
    },

    // Players Section
    players: {
      badge: 'Conviértete en uno de los mejores',
      title1: 'CONVIÉRTETE EN',
      title2: 'UNA ESTRELLA',
      freeAgent: 'Agente Libre',
      viewProfile: 'Ver Perfil',
      playerProfileTitle: 'Perfil de Jugador',
      competitiveInfo: 'Información Competitiva',
      activeTeam: 'Equipo Activo',
      unaffiliated: 'Sin equipo (Agente Libre)',
      gameData: 'Datos en Juego',
      gameRole: 'Rol en Juego',
      server: 'Servidor',
      gameId: 'ID en Juego',
      discord: 'Discord',
      playerNotFound: 'Jugador no encontrado',
      playerNotFoundDesc: 'El perfil de jugador que buscas no existe o no ha sido aprobado aún.',
      backToHome: 'Volver al Inicio',
    },

    // Media / GMX TV Section
    media: {
      badge: 'GMX TV',
      title1: 'CONTENIDO',
      title2: 'DESTACADO',
    },

    // Casters Section
    casters: {
      bgText: 'TALENTO',
      badge: 'Voces de GMX',
      title1: 'NUESTROS',
      title2: 'CASTERS',
      wantToBeCaster: '¿Quieres ser Caster?',
      applyWhatsApp: 'Postúlate por WhatsApp',
    },

    // Cinematic Section
    cinematic: {
      badgeLeft: 'Compite al más alto nivel',
      titleLeft: ['CONSTRUYE', 'TU CAMINO', 'HACIA LA CIMA'],
      goToProfile: 'IR A TU PERFIL',
      registerNow: 'REGÍSTRATE AHORA',
      badgeRight: 'Tu próxima partida puede cambiarlo todo',
      titleRight: ['JUEGA.', 'MEJORA.', 'CONQUISTA.'],
      viewTournaments: 'VER TORNEOS',
    },

    // Video Section
    video: {
      badge: 'Vive la competencia',
      title: ['TU CAMINO', 'COMIENZA AQUÍ'],
      goToProfile: 'IR A TU PERFIL',
      joinGmx: 'ÚNETE A GMX',
      playAria: 'Reproducir vídeo de GMX Gaming',
      closeAria: 'Cerrar vídeo',
      videoTitle: 'Vídeo oficial de GMX Gaming',
    },

    // What You Get Section
    whatYouGet: {
      badge: 'Forma parte de algo más grande',
      title: ['QUÉ OBTENDRÁS', 'AL UNIRTE A', 'GMX GAMING'],
      description: 'Al ser parte de nuestra comunidad, ganarás exposición internacional, competirás en torneos globales y tendrás la oportunidad de brillar en eventos presenciales de talla mundial. Además, obtendrás el prestigioso reconocimiento de la Federación Mexicana de Esports, acceso a recompensas exclusivas y la posibilidad de conectar con una red apasionada de jugadores. Mejora tus habilidades, vive la adrenalina de la competencia y lleva tu pasión por el gaming a nuevos horizontes con GMX Gaming, ¡donde los sueños de los gamers se hacen realidad!',
      benefits: [
        { n: '01', title: 'EXPOSICIÓN INTERNACIONAL' },
        { n: '02', title: 'TORNEOS GLOBALES' },
        { n: '03', title: 'EVENTOS PRESENCIALES' },
        { n: '04', title: 'RECONOCIMIENTO ESPORTS' },
        { n: '05', title: 'RECOMPENSAS EXCLUSIVAS' },
        { n: '06', title: 'NETWORKING GAMER' },
        { n: '07', title: 'MEJORA COMPETITIVA' },
        { n: '08', title: 'OPORTUNIDADES PROFESIONALES' },
      ],
    },

    // CTA Primary Section
    ctaPrimary: {
      badge: 'El siguiente nivel te espera',
      title: ['ÚNETE A GMX GAMING', 'Y CONVIÉRTETE EN', 'EL PRÓXIMO PRO'],
      goToProfile: 'IR A TU PERFIL',
      createUser: 'CREA TU USUARIO',
      playerImgAlt: 'Campeón de GMX Gaming con trofeo',
    },

    // Partners Section
    partners: {
      ariaLabel: 'Nuestros Sponsors y Aliados',
      subtitle: 'Partners · Patrocinadores · Ligas · Federaciones',
    },

    // Newsletter Section
    newsletter: {
      title: ['TU CAMINO EN LOS ESPORTS', 'COMIENZA HOY'],
      activeSession: 'Sesión activa como:',
      emailPlaceholder: 'Correo electrónico',
      goToProfile: 'IR A TU PERFIL',
      createUser: 'CREA TU USUARIO',
      loggedInDesc: 'Ya formas parte de la comunidad. Visita tu perfil para gestionar tus equipos, estadísticas y contratos.',
      loggedOutDesc: 'Únete a la comunidad y recibe novedades de torneos y eventos.',
    },

    // Footer Section
    footer: {
      tagline: 'GMX Gaming, la organización número 1 en ligas, torneos y eventos de eSports en MOBAs de habla hispana.',
      navTitle: 'NAVEGACIÓN',
      communityTitle: 'COMUNIDAD',
      accountTitle: 'CUENTA',
      home: 'Inicio',
      tournaments: 'Torneos',
      media: 'Media / GMX TV',
      teams: 'Equipos',
      featuredPlayers: 'Jugadores Destacados',
      casters: 'Nuestros Casters',
      beACaster: 'Sé un Caster',
      discord: 'Discord',
      login: 'Ingresar',
      register: 'Registrarse',
      profile: 'Mi Perfil',
      copyright: 'Copyright © {year} GMX Gaming. Todos los Derechos Reservados.',
      developedBy: 'Desarrollado por K&T',
      privacy: 'Privacidad',
      terms: 'Términos',
      cookies: 'Cookies',
    },

    // Statuses and Badges
    status: {
      upcoming: 'Próximo',
      ongoing: 'En Curso',
      finished: 'Finalizado',
      completed: 'Completado',
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      rejected: 'Rechazado',
      approved: 'Aprobado',
      banned: 'Suspendido',
      live: 'En Vivo',
      scheduled: 'Programado',
      freeAgent: 'Agente Libre',
      pendingRelease: 'Baja Pendiente',
      unknown: 'Desconocido',
    },

    // Divisions
    divisions: {
      maleOrMixed: 'Varonil / Mixto',
      female: 'Femenil',
    },

    // Roles
    roles: {
      player: 'Jugador',
      coach: 'Coach',
      analyst: 'Analista',
      sportsPsychologist: 'Psicólogo Deportivo',
      manager: 'Manager',
      captain: 'Capitán',
      substitute: 'Suplente',
      contentCreator: 'Creador de Contenido',
      staff: 'Staff',
      noRole: 'Sin rol asignado',
      line: 'Línea',
    },

    // Auth & Account Pages
    auth: {
      loginTitle: 'INICIAR SESIÓN',
      loginSubtitle: 'Ingresa a tu cuenta de GMX Gaming.',
      registerTitle: 'CREA TU USUARIO',
      registerSubtitle: 'Regístrate para acceder a todas las funciones de GMX Gaming.',
      emailLabel: 'Correo Electrónico',
      passwordLabel: 'Contraseña',
      confirmPasswordLabel: 'Confirmar Contraseña',
      continueWithGoogle: 'Continuar con Google',
      connectingWithGoogle: 'CONECTANDO CON GOOGLE...',
      continueWithGoogleBtn: 'CONTINUAR CON GOOGLE',
      orDivider: 'O continúa con tu correo',
      orLetter: 'O',
      submitLogin: 'INGRESAR',
      submitRegister: 'CREAR CUENTA',
      forgotPassword: '¿Olvidaste tu contraseña?',
      dontHaveAccount: '¿No tienes una cuenta? Regístrate aquí.',
      alreadyHaveAccount: '¿Ya tienes una cuenta? Inicia sesión aquí.',
      registerLink: 'Regístrate aquí',
      loginLink: 'Inicia sesión',
      passwordsDoNotMatch: 'Las contraseñas no coinciden.',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres.',
      checkYourEmail: 'Por favor revisa tu correo electrónico para confirmar tu cuenta.',
      emailNotConfirmedTitle: 'Verifica tu correo',
      emailNotConfirmedDesc: 'Te enviamos un correo de verificación. Puedes continuar usando la plataforma, pero te recomendamos verificarlo pronto.',
      backToHome: 'Volver al Inicio',
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
    },

    // Tournaments Page
    tournamentsPage: {
      title: 'Torneos y Ligas',
      subtitle: 'El ecosistema competitivo oficial de GMX Gaming.',
      ongoing: 'En Curso',
      upcoming: 'Próximos Torneos',
      past: 'Torneos Pasados',
      noTournaments: 'No hay torneos registrados',
      noTournamentsDesc: 'Los próximos torneos aparecerán aquí automáticamente.',
      tbd: 'TBD',
    },

    // Tournament Detail Page
    tournamentDetail: {
      notFoundTitle: 'Torneo no encontrado',
      notFoundDesc: 'El torneo que buscas no existe o ha sido eliminado.',
      backToTournaments: 'Volver a Torneos',
      teamsCount: 'Equipos',
      inscribeBtn: 'INSCRIBIRME AL TORNEO',
      distributionTitle: 'Distribución',
      noDistribution: 'Distribución no anunciada.',
      participantsTitle: 'Participantes',
      noParticipants: 'Equipos por anunciar.',
      matchesTitle: 'Encuentros y Resultados',
      noMatchesTitle: 'Calendario en preparación',
      noMatchesDesc: 'Los encuentros serán publicados pronto.',
      tbd: 'TBD',
      vs: 'VS',
      toastLoginRequired: 'Debes registrarte o iniciar sesión para inscribir a tu equipo.',
    },

    // Teams Page
    teamsPage: {
      title: 'Equipos Afiliados',
      subtitle: 'Conoce a las organizaciones y escuadras profesionales que forman parte del ecosistema competitivo de GMX Gaming.',
      searchPlaceholder: 'Buscar equipo...',
      noTeamsTitle: 'No hay equipos afiliados',
      noTeamsDesc: 'Actualmente no contamos con equipos registrados en la plataforma. ¡Sé el primero en afiliar a tu organización!',
      registerTeamBtn: 'Registrar Equipo',
      noSearchResults: 'No se encontraron equipos que coincidan con la búsqueda.',
      international: 'Internacional',
    },

    // Team Detail Page
    teamDetail: {
      notFoundTitle: 'Equipo no encontrado',
      notFoundDesc: 'El equipo que buscas no existe o ha sido eliminado.',
      backToHome: 'Volver al Inicio',
      tournamentsPlayed: 'Torneos Jugados',
      manager: 'Manager',
      currentRoster: 'Roster Actual',
      noRosterTitle: 'Sin roster activo',
      noRosterDesc: 'Este equipo no tiene jugadores con contrato activo.',
      latestMatches: 'Últimos Encuentros',
      noMatches: 'No hay historial de encuentros.',
      unknownCountry: 'Desconocido',
      vs: 'vs',
    },

    // Player Detail Page
    playerDetail: {
      featuredPlayer: 'Jugador Destacado',
      gameInfo: 'Info del Juego',
      gameId: 'ID del Juego',
      server: 'Servidor',
      countryAccount: 'País (Cuenta)',
      country: 'País',
      contractRole: 'Rol',
      noGameInfo: 'No hay información del juego registrada.',
      currentTeams: 'Equipos Actuales',
      activeStatus: 'Activo',
      noContracts: 'Este jugador no tiene contratos activos con ningún equipo actualmente.',
    },

    // 404 Page
    not_found: {
      gameOver: 'GAME OVER',
      title: '¡Página no encontrada!',
      description: 'Parece que te has salido del mapa. La ruta que estás buscando no existe en nuestro servidor o ha sido eliminada.',
      backToBase: 'VOLVER A LA BASE',
      viewTournaments: 'VER TORNEOS',
    },
  },

  en: {
    // Navigation
    nav: {
      home: 'HOME',
      esportsRegistration: 'ESPORTS REGISTRATION',
      registerTeam: 'REGISTER TEAM',
      registerPlayer: 'REGISTER PLAYER',
      registerContract: 'REGISTER CONTRACT',
      affiliatedTeams: 'AFFILIATED TEAMS',
      tournaments: 'TOURNAMENTS',
      media: 'Media / GMX TV',
      featuredPlayers: 'Featured Players',
      ourCasters: 'Our Casters',
      beACaster: 'Become a Caster',
      discord: 'Discord',
    },

    // Header & User Actions
    header: {
      searchPlaceholder: 'Search...',
      searchModalPlaceholder: 'Search players by IGN, teams or tournaments...',
      searchMinChars: 'Type at least 2 characters...',
      searchNoResults: 'No results found for',
      searchTypePlayer: 'Player',
      searchTypeTeam: 'Team',
      searchTypeTournament: 'Tournament',
      myAccount: 'MY ACCOUNT',
      administration: 'ADMINISTRATION',
      login: 'LOGIN',
      createUser: 'CREATE ACCOUNT',
      logout: 'LOGOUT',
      languageLabel: 'Language',
      logoutModalTitle: 'Log Out?',
      logoutModalDesc: 'You are about to log out of your GMX Gaming account. Do you wish to continue?',
      cancel: 'Cancel',
      confirmLogout: 'Yes, Log Out',
      restrictedAccess: 'Restricted Access',
      restrictedLoginDesc: 'You must log in to register teams, players, or contracts on the platform.',
      restrictedPlayerDesc: 'You must be an Approved Pro Player to register a contract.',
      viewMyAccount: 'View My Account',
      followUs: 'Follow Us',
    },

    // Hero Section
    hero: {
      hudEst: 'EST. 2024',
      hudSubtitle: 'GMX GAMING / ESPORTS / COMPETITION',
      hudCompete: '01 / COMPETE',
      hudGrow: '02 / GROW',
      hudDominate: '03 / DOMINATE',
      welcomeBadge: 'WELCOME TO GMX GAMING!',
      titleWords: ['HERE', 'BEGINS', 'THE', 'JOURNEY'],
      subtitle: 'BECOME A PROFESSIONAL ESPORTS PLAYER',
      description: 'Compete, grow, and showcase your skills within a premier community built to take gaming talent to the highest level.',
      goToProfile: 'GO TO YOUR PROFILE',
      createUserBtn: 'CREATE ACCOUNT',
      exploreTournaments: 'EXPLORE TOURNAMENTS',
      scrollIndicator: 'SCROLL TO EXPLORE',
      ticker: ['LEAGUES', 'TOURNAMENTS', 'EVENTS', 'MOBILE LEGENDS', 'HONOR OF KINGS', 'ESPORTS'],
    },

    // About Section
    about: {
      badge: 'Why register?',
      title1: 'PUSH BEYOND',
      title2: 'YOUR LIMITS',
      description: 'Your epic esports adventure begins here! Join a passionate community and experience the thrill of electrifying tournaments, top-tier competitions, and premier events connecting players worldwide. Whether beginner or veteran, GMX Gaming offers the stage to prove your skills, claim incredible rewards, and join a gaming revolution. Register today and enter a universe where every match matters and fun knows no limits!',
      playersCount: '+100',
      playersLabel: 'Players',
      benefits: [
        {
          n: '01',
          title: 'COMPETITIVE TOURNAMENTS',
          desc: 'Compete in high-level brackets and leagues featuring real prize pools every season.',
        },
        {
          n: '02',
          title: 'GLOBAL EXPOSURE',
          desc: 'Showcase your talent before an international audience and professional scouting teams.',
        },
        {
          n: '03',
          title: 'ESPORTS COMMUNITY',
          desc: 'Connect with thousands of dedicated players living the competitive spirit every day.',
        },
        {
          n: '04',
          title: 'CAREER ADVANCEMENT',
          desc: 'Make the leap from amateur gaming into the official professional esports circuit.',
        },
      ],
    },

    // Marquee Bands
    marquee: {
      line1: ['GMX GAMING', 'HERE BEGINS THE JOURNEY', 'PUSH BEYOND YOUR LIMITS', 'COMPETE. GROW. DOMINATE.'],
      line2: ['ESPORTS TOURNAMENTS', 'MOBILE LEGENDS', 'HIGH-TIER COMPETITION', 'BECOME A STAR'],
    },

    // Tournaments Section
    tournaments: {
      badge: 'Latest from the scene',
      title1: 'LATEST TOURNAMENTS',
      title2: '& NEWS',
      viewAll: 'View All Tournaments',
      readMore: 'Read more',
      upcoming: 'Coming Soon',
      officialTournament: 'Official Tournament',
      defaultDesc: 'Official Mobile Legends tournament. The top rosters clash for the ultimate title and glory.',
      noTournamentsRegistered: 'No tournaments found',
      noTournamentsDesc: 'Upcoming tournaments will appear here automatically.',
      ongoingSection: 'Ongoing',
      upcomingSection: 'Upcoming Tournaments',
      pastSection: 'Past Tournaments',
      viewBracket: 'View Brackets & Matches',
      teamsCount: 'Teams',
      prize: 'Prize',
      dateTbd: 'TBD',
      backToTournaments: 'Back to Tournaments',
      tournamentNotFound: 'Tournament Not Found',
      tournamentNotFoundDesc: 'The tournament you are looking for does not exist or has been removed.',
      registerForTournament: 'REGISTER FOR TOURNAMENT',
      tabsMatches: 'Matches & Brackets',
      tabsTeams: 'Participating Teams',
      tabsRules: 'Rules & Prizes',
      rulesTitle: 'Official Rules',
      rulesDesc: 'All teams must comply with official GMX Gaming regulations and check in 15 minutes prior to match time.',
      prizepoolTitle: 'Prize Pool',
      prizepoolDesc: 'Official payout distribution for top tournament placements.',
      noMatchesYet: 'No matches have been scheduled yet for this tournament.',
      noTeamsYet: 'No teams registered in this tournament yet.',
      matchLive: 'Live Now',
      matchFinished: 'Finished',
      matchScheduled: 'Scheduled',
    },

    // Teams Section
    teams: {
      badge: 'The elite competes with us',
      title: 'AFFILIATED TEAMS',
      pageTitle: 'Affiliated Teams',
      pageDesc: 'Discover the esports organizations and professional squads competing in the GMX Gaming ecosystem.',
      searchPlaceholder: 'Search team...',
      noTeamsTitle: 'No affiliated teams',
      noTeamsDesc: 'No teams currently registered. Be the first organization to affiliate with GMX Gaming!',
      registerTeamBtn: 'Register Team',
      noTeamsFoundSearch: 'No teams found matching your search criteria.',
      viewProfile: 'View Profile',
      unknownCountry: 'Unknown',
      officialAffiliatedTeam: 'Official Affiliated Team',
      officialManager: 'Official Manager',
      noManagerAssigned: 'No manager assigned',
      activeRoster: 'Active Roster',
      rosterSectionTitle: 'Current Roster',
      noPlayersInRoster: 'This team has no active confirmed players on their roster yet.',
      matchHistory: 'Match History',
      noMatchHistory: 'This team has not played any registered matches on the platform yet.',
      tournamentsPlayed: 'Tournaments Played',
      victories: 'Victories',
      members: 'Members',
      teamNotFound: 'Team Not Found',
      teamNotFoundDesc: 'The team you are looking for does not exist or has been deactivated.',
      backToTeams: 'Back to Teams',
      countryLabel: 'Country',
    },

    // Players Section
    players: {
      badge: 'Become one of the best',
      title1: 'BECOME',
      title2: 'A STAR',
      freeAgent: 'Free Agent',
      viewProfile: 'View Profile',
      playerProfileTitle: 'Player Profile',
      competitiveInfo: 'Competitive Information',
      activeTeam: 'Active Team',
      unaffiliated: 'Unaffiliated (Free Agent)',
      gameData: 'Game Details',
      gameRole: 'In-Game Role',
      server: 'Server',
      gameId: 'In-Game ID',
      discord: 'Discord',
      playerNotFound: 'Player Not Found',
      playerNotFoundDesc: 'The player profile you are looking for does not exist or has not been approved yet.',
      backToHome: 'Back to Home',
    },

    // Media / GMX TV Section
    media: {
      badge: 'GMX TV',
      title1: 'FEATURED',
      title2: 'CONTENT',
    },

    // Casters Section
    casters: {
      bgText: 'TALENT',
      badge: 'Voices of GMX',
      title1: 'OUR',
      title2: 'CASTERS',
      wantToBeCaster: 'Want to be a Caster?',
      applyWhatsApp: 'Apply via WhatsApp',
    },

    // Cinematic Section
    cinematic: {
      badgeLeft: 'Compete at the highest level',
      titleLeft: ['BUILD', 'YOUR PATH', 'TO THE TOP'],
      goToProfile: 'GO TO YOUR PROFILE',
      registerNow: 'REGISTER NOW',
      badgeRight: 'Your next match can change everything',
      titleRight: ['PLAY.', 'IMPROVE.', 'CONQUER.'],
      viewTournaments: 'VIEW TOURNAMENTS',
    },

    // Video Section
    video: {
      badge: 'Experience the competition',
      title: ['YOUR JOURNEY', 'BEGINS HERE'],
      goToProfile: 'GO TO YOUR PROFILE',
      joinGmx: 'JOIN GMX',
      playAria: 'Play GMX Gaming video',
      closeAria: 'Close video',
      videoTitle: 'Official GMX Gaming video',
    },

    // What You Get Section
    whatYouGet: {
      badge: 'Be part of something bigger',
      title: ['WHAT YOU GET', 'BY JOINING', 'GMX GAMING'],
      description: 'As a member of our community, you gain international exposure, compete in global tournaments, and earn the chance to shine on stage at premier in-person events. You also receive official recognition from the Mexican Esports Federation, exclusive reward access, and connection with a passionate network of gamers. Hone your skills, experience the adrenaline of elite competition, and take your gaming journey to new heights with GMX Gaming—where gamers\' dreams become reality!',
      benefits: [
        { n: '01', title: 'GLOBAL EXPOSURE' },
        { n: '02', title: 'GLOBAL TOURNAMENTS' },
        { n: '03', title: 'IN-PERSON EVENTS' },
        { n: '04', title: 'ESPORTS RECOGNITION' },
        { n: '05', title: 'EXCLUSIVE REWARDS' },
        { n: '06', title: 'GAMER NETWORKING' },
        { n: '07', title: 'COMPETITIVE MASTERY' },
        { n: '08', title: 'PRO OPPORTUNITIES' },
      ],
    },

    // CTA Primary Section
    ctaPrimary: {
      badge: 'The next level awaits you',
      title: ['JOIN GMX GAMING', 'AND BECOME', 'THE NEXT PRO'],
      goToProfile: 'GO TO YOUR PROFILE',
      createUser: 'CREATE ACCOUNT',
      playerImgAlt: 'GMX Gaming Champion with trophy',
    },

    // Partners Section
    partners: {
      ariaLabel: 'Our Sponsors and Partners',
      subtitle: 'Partners · Sponsors · Leagues · Federations',
    },

    // Newsletter Section
    newsletter: {
      title: ['YOUR ESPORTS JOURNEY', 'STARTS TODAY'],
      activeSession: 'Logged in as:',
      emailPlaceholder: 'Email address',
      goToProfile: 'GO TO YOUR PROFILE',
      createUser: 'CREATE ACCOUNT',
      loggedInDesc: 'You are already part of the community. Visit your profile to manage teams, stats, and contracts.',
      loggedOutDesc: 'Join our community and get direct updates on upcoming tournaments and events.',
    },

    // Footer Section
    footer: {
      tagline: 'GMX Gaming, the #1 organization for competitive esports leagues, tournaments, and events in Spanish-speaking MOBAs.',
      navTitle: 'NAVIGATION',
      communityTitle: 'COMMUNITY',
      accountTitle: 'ACCOUNT',
      home: 'Home',
      tournaments: 'Tournaments',
      media: 'Media / GMX TV',
      teams: 'Teams',
      featuredPlayers: 'Featured Players',
      casters: 'Our Casters',
      beACaster: 'Become a Caster',
      discord: 'Discord',
      login: 'Login',
      register: 'Register',
      profile: 'My Profile',
      copyright: 'Copyright © {year} GMX Gaming. All Rights Reserved.',
      developedBy: 'Desarrollado por K&T',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies',
    },

    // Statuses and Badges
    status: {
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      finished: 'Finished',
      completed: 'Completed',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      rejected: 'Rejected',
      approved: 'Approved',
      banned: 'Banned',
      live: 'Live Now',
      scheduled: 'Scheduled',
      freeAgent: 'Free Agent',
      pendingRelease: 'Pending Release',
      unknown: 'Unknown',
    },

    // Divisions
    divisions: {
      maleOrMixed: "Men's / Mixed",
      female: "Women's",
    },

    // Roles
    roles: {
      player: 'Player',
      coach: 'Coach',
      analyst: 'Analyst',
      sportsPsychologist: 'Sports Psychologist',
      manager: 'Manager',
      captain: 'Captain',
      substitute: 'Substitute',
      contentCreator: 'Content Creator',
      staff: 'Staff',
      noRole: 'No role assigned',
      line: 'Lane',
    },

    // Auth & Account Pages
    auth: {
      loginTitle: 'SIGN IN',
      loginSubtitle: 'Log in to your GMX Gaming account.',
      registerTitle: 'CREATE YOUR USER',
      registerSubtitle: 'Sign up to access all GMX Gaming features.',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      continueWithGoogle: 'Continue with Google',
      connectingWithGoogle: 'CONNECTING TO GOOGLE...',
      continueWithGoogleBtn: 'CONTINUE WITH GOOGLE',
      orDivider: 'Or continue with your email',
      orLetter: 'OR',
      submitLogin: 'SIGN IN',
      submitRegister: 'CREATE ACCOUNT',
      forgotPassword: 'Forgot your password?',
      dontHaveAccount: "Don't have an account? Register here.",
      alreadyHaveAccount: 'Already have an account? Sign in here.',
      registerLink: 'Register here',
      loginLink: 'Sign in',
      passwordsDoNotMatch: 'Passwords do not match.',
      passwordMinLength: 'Password must be at least 6 characters long.',
      checkYourEmail: 'Please check your email to confirm your account.',
      emailNotConfirmedTitle: 'Verify your email',
      emailNotConfirmedDesc: 'We sent you a verification email. You may continue using the platform, but we recommend verifying it soon.',
      backToHome: 'Back to Home',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
    },

    // Tournaments Page
    tournamentsPage: {
      title: 'Tournaments & Leagues',
      subtitle: 'The official competitive ecosystem of GMX Gaming.',
      ongoing: 'Ongoing',
      upcoming: 'Upcoming Tournaments',
      past: 'Past Tournaments',
      noTournaments: 'No tournaments registered',
      noTournamentsDesc: 'Upcoming tournaments will appear here automatically.',
      tbd: 'TBD',
    },

    // Tournament Detail Page
    tournamentDetail: {
      notFoundTitle: 'Tournament not found',
      notFoundDesc: 'The tournament you are looking for does not exist or has been removed.',
      backToTournaments: 'Back to Tournaments',
      teamsCount: 'Teams',
      inscribeBtn: 'ENTER TOURNAMENT',
      distributionTitle: 'Distribution',
      noDistribution: 'Distribution not announced.',
      participantsTitle: 'Participants',
      noParticipants: 'Teams to be announced.',
      matchesTitle: 'Matches & Results',
      noMatchesTitle: 'Schedule in preparation',
      noMatchesDesc: 'Matches will be published soon.',
      tbd: 'TBD',
      vs: 'VS',
      toastLoginRequired: 'You must register or log in to enter your team.',
    },

    // Teams Page
    teamsPage: {
      title: 'Affiliated Teams',
      subtitle: 'Meet the organizations and professional squads competing in the GMX Gaming ecosystem.',
      searchPlaceholder: 'Search team...',
      noTeamsTitle: 'No affiliated teams',
      noTeamsDesc: 'We currently do not have registered teams on the platform. Be the first to affiliate your organization!',
      registerTeamBtn: 'Register Team',
      noSearchResults: 'No teams match your search criteria.',
      international: 'International',
    },

    // Team Detail Page
    teamDetail: {
      notFoundTitle: 'Team not found',
      notFoundDesc: 'The team you are looking for does not exist or has been removed.',
      backToHome: 'Back to Home',
      tournamentsPlayed: 'Tournaments Played',
      manager: 'Manager',
      currentRoster: 'Current Roster',
      noRosterTitle: 'No active roster',
      noRosterDesc: 'This team does not currently have players with an active contract.',
      latestMatches: 'Latest Matches',
      noMatches: 'No match history available.',
      unknownCountry: 'Unknown',
      vs: 'vs',
    },

    // Player Detail Page
    playerDetail: {
      featuredPlayer: 'Featured Player',
      gameInfo: 'Game Info',
      gameId: 'Game ID',
      server: 'Server',
      countryAccount: 'Country (Account)',
      country: 'Country',
      contractRole: 'Role',
      noGameInfo: 'No game information registered.',
      currentTeams: 'Current Teams',
      activeStatus: 'Active',
      noContracts: 'This player currently has no active contracts with any team.',
    },

    // 404 Page
    not_found: {
      gameOver: 'GAME OVER',
      title: 'Page Not Found!',
      description: 'Looks like you drifted off the map. The page you are looking for does not exist on our server or has been removed.',
      backToBase: 'RETURN TO BASE',
      viewTournaments: 'EXPLORE TOURNAMENTS',
    },
  },
} as const
