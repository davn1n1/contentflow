/**
 * Knowledge Base Source Map
 *
 * Defines all content sources for auto-generating help articles.
 * Each entry maps to one help_articles row in Supabase.
 *
 * Paths are relative to the project root (ContentFlow365/app/).
 * The generator reads these files and feeds them to Claude to produce articles.
 */

export interface KBSourceFile {
  type: "route" | "doc" | "component" | "api" | "inline";
  /** Path relative to the project root (ContentFlow365/app/) */
  path?: string;
  /** Inline content for context that doesn't come from a file */
  content?: string;
}

export interface KBSource {
  /** Slug — also used as the article slug in help_articles */
  id: string;
  /** Article title (can be refined by Claude) */
  title: string;
  /** Article category */
  category: string;
  /** Tags for search */
  tags: string[];
  /** Source files to read for context */
  sources: KBSourceFile[];
  /** 1=high priority, 2=medium, 3=low */
  priority: number;
  /** If true, skip generation (article already manually curated) */
  skipIfExists?: boolean;
}

// =====================================================
// GETTING STARTED
// =====================================================

const gettingStarted: KBSource[] = [
  {
    id: "primeros-pasos",
    title: "Primeros pasos con ContentFlow365",
    category: "getting-started",
    tags: ["inicio", "tutorial", "onboarding"],
    sources: [],
    priority: 1,
    skipIfExists: true, // Manually curated
  },
  {
    id: "entender-pipeline",
    title: "Entender el pipeline de produccion",
    category: "getting-started",
    tags: ["pipeline", "pasos", "proceso", "flujo"],
    sources: [],
    priority: 1,
    skipIfExists: true,
  },
  {
    id: "navegar-app",
    title: "Navegar la aplicacion",
    category: "getting-started",
    tags: ["navegacion", "menu", "sidebar", "secciones"],
    sources: [
      { type: "component", path: "src/components/layout/sidebar.tsx" },
      { type: "doc", path: "../docs/frontend/DISENO-NAVEGACION-SIDEBAR.md" },
    ],
    priority: 1,
  },
  {
    id: "configurar-cuenta-inicial",
    title: "Configuracion inicial de tu cuenta",
    category: "getting-started",
    tags: ["onboarding", "configuracion", "cuenta", "inicio"],
    sources: [
      { type: "route", path: "src/app/(onboarding)/onboarding/page.tsx" },
      { type: "doc", path: "../docs/ARQUITECTURA-AUTENTICACION.md" },
    ],
    priority: 1,
  },
  {
    id: "seleccionar-cuenta",
    title: "Seleccionar y cambiar de cuenta",
    category: "getting-started",
    tags: ["cuenta", "selector", "cambiar", "multi-cuenta"],
    sources: [
      { type: "component", path: "src/components/layout/sidebar.tsx" },
      { type: "route", path: "src/app/(app)/dashboard/page.tsx" },
    ],
    priority: 2,
  },
];

// =====================================================
// PRODUCCION YT
// =====================================================

const produccionYT: KBSource[] = [
  {
    id: "research-ideas",
    title: "Research: encontrar ideas de contenido",
    category: "copy-script",
    tags: ["research", "ideas", "tendencias", "youtube", "contenido"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/research/page.tsx" },
      {
        type: "inline",
        content: `Research es la primera pantalla del flujo de produccion YT.
Muestra ideas de contenido basadas en tendencias de YouTube, fuentes de inspiracion
configuradas y analisis de audiencia. El usuario selecciona una idea y desde ahi
crea un nuevo video que entra al pipeline de produccion.`,
      },
    ],
    priority: 1,
  },
  {
    id: "ideas-inspiracion",
    title: "Ideas de inspiracion generadas por IA",
    category: "copy-script",
    tags: ["ideas", "inspiracion", "ia", "contenido", "sugerencias"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/ideas/page.tsx" },
      {
        type: "inline",
        content: `Las Ideas de Inspiracion son sugerencias generadas por IA basadas en
las fuentes de inspiracion configuradas, la audiencia definida y las tendencias actuales
de YouTube. Cada idea incluye valoracion de potencial viral, relevancia para la audiencia
y sugerencias de angulo. El usuario puede crear un video directamente desde una idea.`,
      },
    ],
    priority: 1,
  },
  {
    id: "crear-copy-guion",
    title: "Como crear el copy de un video",
    category: "copy-script",
    tags: ["copy", "guion", "script", "ia", "generar"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/scripts/page.tsx" },
      {
        type: "inline",
        content: `CREAR COPY es el paso 1 del pipeline. Genera el guion completo del video
usando 12+ modelos de IA (GPT, Claude, Gemini, Grok). El proceso:
1. Selecciona o crea una idea de video
2. La IA genera titulo, script dividido en escenas, tags de YouTube
3. Cada escena tiene: tipo (gancho, desarrollo, cierre), duracion estimada, B-roll sugerido
4. El usuario puede revisar y editar antes de pasar a audio
Tiempo estimado: 2-5 minutos. Accion en orchestrator: GenerateCopy.`,
      },
    ],
    priority: 1,
  },
  {
    id: "configurar-voicedna",
    title: "Configurar VoiceDNA",
    category: "copy-script",
    tags: ["voicedna", "voz", "estilo", "configuracion"],
    sources: [],
    priority: 1,
    skipIfExists: true,
  },
  {
    id: "generar-audio",
    title: "Generacion de audio con ElevenLabs",
    category: "audio",
    tags: ["audio", "elevenlabs", "voz", "tts", "generar"],
    sources: [
      {
        type: "inline",
        content: `CREAR AUDIO es el paso 2 del pipeline. Genera la voz narrada con ElevenLabs
para cada escena del video. El proceso:
1. Requiere: Copy completado + VoiceDNA configurado
2. ElevenLabs genera audio por escena usando la voz seleccionada
3. Se crean slides visuales y se asigna B-roll
4. Se puede revisar y regenerar escenas individuales
Tiempo estimado: 3-10 minutos. Accion: GenerateAudio.
La pantalla Script & Audio muestra pestana Audio con cada escena, su duracion y estado.`,
      },
    ],
    priority: 1,
  },
  {
    id: "crear-video-avatares",
    title: "Avatares HeyGen: crear video",
    category: "video",
    tags: ["avatares", "heygen", "video", "generar", "avatar"],
    sources: [
      {
        type: "inline",
        content: `CREAR VIDEO es el paso 3 del pipeline. Crea clips de avatar con HeyGen
para cada escena. El proceso:
1. Requiere: Audio completado
2. HeyGen genera un video de avatar sincronizado con el audio por escena
3. Se puede usar un avatar individual o un set de avatares (rotacion automatica)
4. El video del avatar incluye lip-sync y gestos naturales
Tiempo estimado: 5-15 minutos. Accion: GenerateAvatars.
Importante: Verificar creditos de HeyGen antes de generar.`,
      },
    ],
    priority: 1,
  },
  {
    id: "render-final-publicacion",
    title: "Render final y publicacion en YouTube",
    category: "render",
    tags: ["render", "shotstack", "youtube", "publicar", "final"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/renders/page.tsx" },
      {
        type: "inline",
        content: `RENDER FINAL es el paso 4 del pipeline. Ensambla todo y publica. El proceso:
1. Requiere: Video (avatares) completado
2. Shotstack ensambla: avatar + audio + slides + B-roll + musica de fondo
3. Se aplican transiciones, efectos y overlays
4. El video final se sube automaticamente a YouTube con titulo, descripcion y tags
5. Se generan clips cortos (Shorts/Reels) automaticamente
Tiempo estimado: 5-20 minutos. Accion: ProcesoFinalRender.
La pantalla Renders muestra todos los renders con su estado.`,
      },
    ],
    priority: 1,
  },
  {
    id: "ver-detalle-video",
    title: "Ver detalle de un video y sus escenas",
    category: "video",
    tags: ["video", "detalle", "escenas", "estado", "pipeline"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/videos/[id]/page.tsx" },
      { type: "route", path: "src/app/(app)/[client-slug]/scenes/[id]/page.tsx" },
      { type: "route", path: "src/app/(app)/[client-slug]/videos/page.tsx" },
    ],
    priority: 2,
  },
];

// =====================================================
// APP DATA (Configuracion)
// =====================================================

const appData: KBSource[] = [
  {
    id: "configurar-avatares",
    title: "Configurar avatares y sets de avatares",
    category: "app-data",
    tags: ["avatares", "sets", "heygen", "configuracion", "personaje"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/avatares/page.tsx" },
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/avatares-set/page.tsx" },
      {
        type: "inline",
        content: `Los avatares son personas virtuales (HeyGen) que narran los videos.
Avatares individuales: cada avatar disponible con su nombre, estilo y configuracion.
Sets de avatares: grupos predefinidos para rotar automaticamente entre escenas.
El usuario puede tener multiples avatares y sets por cuenta.`,
      },
    ],
    priority: 1,
  },
  {
    id: "configurar-persona",
    title: "Configurar Persona y Guardrails",
    category: "app-data",
    tags: ["persona", "guardrails", "marca", "tono", "estilo", "ia"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/persona/page.tsx" },
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/guardarails/page.tsx" },
      {
        type: "inline",
        content: `Persona define la personalidad del narrador/presentador del canal.
Incluye: tono de voz, estilo de comunicacion, expertise, valores de marca.
Guardrails son reglas y limites para la IA: que NO decir, temas a evitar,
directrices de marca, formato preferido. Ambos se usan en la generacion de copy.`,
      },
    ],
    priority: 1,
  },
  {
    id: "configurar-ctas",
    title: "Configurar llamadas a la accion (CTAs)",
    category: "app-data",
    tags: ["ctas", "llamada-accion", "conversion", "youtube"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/ctas/page.tsx" },
      {
        type: "inline",
        content: `Las CTAs (Call To Action) son los mensajes que se insertan en los videos
para invitar al espectador a tomar una accion: suscribirse, comentar, visitar un enlace, etc.
Se configuran por cuenta y se insertan automaticamente en los scripts generados por IA.`,
      },
    ],
    priority: 2,
  },
  {
    id: "gestionar-broll",
    title: "Gestionar B-Roll personalizado",
    category: "app-data",
    tags: ["broll", "b-roll", "video", "recursos", "visuales"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/broll/page.tsx" },
      {
        type: "inline",
        content: `B-Roll son clips de video o imagenes que se superponen al avatar durante el video.
Se usan para ilustrar conceptos, mostrar graficos o aportar variedad visual.
Tipos: B-Roll automatico (de Pexels/Pixabay) y B-Roll personalizado (subido por el usuario).
Cada escena puede tener B-Roll asignado manual o automaticamente.`,
      },
    ],
    priority: 2,
  },
  {
    id: "configurar-voces",
    title: "Configurar voces disponibles",
    category: "app-data",
    tags: ["voces", "elevenlabs", "tts", "voz", "configuracion"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/voices/page.tsx" },
      {
        type: "inline",
        content: `Las Voces son las voces sintetizadas de ElevenLabs disponibles para la cuenta.
Cada voz tiene: nombre, idioma, estilo, velocidad. El usuario puede probar
diferentes voces antes de usarlas en produccion. Las voces se vinculan al VoiceDNA.`,
      },
    ],
    priority: 2,
  },
  {
    id: "configurar-voicedna-sources",
    title: "Fuentes de VoiceDNA",
    category: "app-data",
    tags: ["voicedna", "fuentes", "estilo-voz", "entrenamiento"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/voicedna-sources/page.tsx" },
      {
        type: "inline",
        content: `VoiceDNA Sources son muestras de texto o audio que definen el estilo de escritura
del canal. La IA analiza estas fuentes para replicar el tono, vocabulario y estructura
del creador. Se pueden subir: transcripciones de videos anteriores, articulos del blog,
hilos de redes sociales. Cuantas mas fuentes, mejor replica la IA el estilo.`,
      },
    ],
    priority: 2,
  },
  {
    id: "configurar-audiencia",
    title: "Definir tu audiencia objetivo",
    category: "app-data",
    tags: ["audiencia", "segmentos", "target", "publico", "objetivo"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/audiencia/page.tsx" },
      {
        type: "inline",
        content: `La seccion Audiencia permite definir los segmentos de publico objetivo del canal.
Cada segmento incluye: demografia, intereses, problemas que buscan resolver, nivel de conocimiento.
Esta informacion la usa la IA para adaptar el tono, complejidad y enfoque de los scripts.`,
      },
    ],
    priority: 2,
  },
  {
    id: "gestionar-sponsors-brands",
    title: "Gestionar Sponsors y Brands",
    category: "app-data",
    tags: ["sponsors", "brands", "marcas", "patrocinadores", "colaboraciones"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/sponsors/page.tsx" },
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/brands/page.tsx" },
      {
        type: "inline",
        content: `Sponsors son patrocinadores del canal cuyos mensajes se pueden integrar en los videos.
Brands son marcas propias del creador. Ambos se usan para generar menciones contextuales
en los scripts y añadir overlays/CTAs en el render final.`,
      },
    ],
    priority: 3,
  },
  {
    id: "identidad-visual",
    title: "Configurar identidad visual",
    category: "app-data",
    tags: ["identidad", "visual", "colores", "fuentes", "marca", "branding"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/identidad-visual/page.tsx" },
      {
        type: "inline",
        content: `Identidad Visual define los elementos graficos del canal: colores primarios/secundarios,
tipografias, logos, estilos de slides. Estos se aplican automaticamente en los renders
para mantener consistencia visual en todos los videos.`,
      },
    ],
    priority: 2,
  },
  {
    id: "configuracion-defecto",
    title: "Configuracion por defecto de la cuenta",
    category: "app-data",
    tags: ["defecto", "default", "configuracion", "ajustes", "cuenta"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/default-settings/page.tsx" },
      {
        type: "inline",
        content: `Default Settings permite configurar valores por defecto para la generacion de videos:
avatar preferido, voz por defecto, duracion objetivo, estilo de slides, musica de fondo,
nivel de energia del presentador, idioma principal, etc.`,
      },
    ],
    priority: 2,
  },
  {
    id: "fuentes-inspiracion",
    title: "Configurar fuentes de inspiracion",
    category: "app-data",
    tags: ["fuentes", "inspiracion", "contenido", "ideas", "referencias"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/fuentes/page.tsx" },
      {
        type: "inline",
        content: `Las Fuentes de Inspiracion son canales de YouTube, blogs, newsletters u otras fuentes
que el usuario sigue para obtener ideas de contenido. La IA las analiza periodicamente
para sugerir temas relevantes en la seccion Research e Ideas.`,
      },
    ],
    priority: 2,
  },
  {
    id: "spy-ads-reels",
    title: "Spy Ads & Reels",
    category: "app-data",
    tags: ["spy", "ads", "reels", "competencia", "analisis"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/spy/page.tsx" },
      {
        type: "inline",
        content: `Spy Ads & Reels permite analizar anuncios y reels de la competencia.
Se pueden guardar y analizar creatividades de otros canales para inspiracion
y benchmarking.`,
      },
    ],
    priority: 3,
  },
];

// =====================================================
// REMOTION
// =====================================================

const remotion: KBSource[] = [
  {
    id: "remotion-preview",
    title: "Preview de videos con Remotion",
    category: "remotion",
    tags: ["remotion", "preview", "player", "video", "editor"],
    sources: [
      { type: "route", path: "src/app/(app)/remotion/[id]/page.tsx" },
      { type: "doc", path: "../docs/remotion/REMOTION-EXPANSION.md" },
    ],
    priority: 1,
  },
  {
    id: "remotion-lista-timelines",
    title: "Lista de timelines de video",
    category: "remotion",
    tags: ["remotion", "timelines", "lista", "videos", "editor"],
    sources: [
      { type: "route", path: "src/app/(app)/remotion/page.tsx" },
      {
        type: "inline",
        content: `La pagina de Remotion lista todos los timelines de video generados.
Cada timeline corresponde a un video renderizado y muestra: titulo, fecha,
duracion, numero de clips. Al hacer click se abre el Player de preview.`,
      },
    ],
    priority: 2,
  },
  {
    id: "remotion-proxy-cdn",
    title: "CDN y proxy de videos (Cloudflare Stream)",
    category: "remotion",
    tags: ["cdn", "cloudflare", "stream", "proxy", "rendimiento"],
    sources: [
      { type: "doc", path: "../docs/remotion/CLOUDFLARE-STREAM-SETUP.md" },
      {
        type: "inline",
        content: `ContentFlow365 usa Cloudflare Stream como CDN para servir los videos
de manera eficiente. Los videos originales (S3, HeyGen) se proxean por Cloudflare
para mejor latencia y streaming adaptativo. La pagina de preview permite
activar el proxy para cada video individualmente.`,
      },
    ],
    priority: 3,
  },
];

// =====================================================
// ACCOUNT & SETTINGS
// =====================================================

const account: KBSource[] = [
  {
    id: "gestionar-cuenta",
    title: "Gestionar tu cuenta",
    category: "account",
    tags: ["cuenta", "configuracion", "perfil", "ajustes"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/settings/page.tsx" },
    ],
    priority: 1,
  },
  {
    id: "gestionar-equipo",
    title: "Gestion de equipo",
    category: "account",
    tags: ["equipo", "team", "colaboradores", "permisos", "usuarios"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/team/page.tsx" },
      {
        type: "inline",
        content: `La seccion Team permite gestionar los miembros del equipo que tienen acceso
a la cuenta. Se pueden invitar colaboradores, asignar roles y permisos.
Cada miembro puede tener acceso a diferentes secciones de la app.`,
      },
    ],
    priority: 2,
  },
  {
    id: "perfiles-sociales",
    title: "Perfiles sociales conectados",
    category: "account",
    tags: ["social", "perfiles", "youtube", "redes", "conexion"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/app-data/social-profiles/page.tsx" },
      {
        type: "inline",
        content: `Social Profiles permite conectar las cuentas de redes sociales del usuario:
YouTube, Instagram, TikTok, LinkedIn, etc. La conexion permite publicacion automatica
y analisis de rendimiento de los videos en cada plataforma.`,
      },
    ],
    priority: 2,
  },
];

// =====================================================
// NAVIGATION
// =====================================================

const navigation: KBSource[] = [
  {
    id: "menu-lateral-secciones",
    title: "Menu lateral y secciones de la app",
    category: "navigation",
    tags: ["menu", "sidebar", "navegacion", "secciones", "layout"],
    sources: [
      { type: "component", path: "src/components/layout/sidebar.tsx" },
      { type: "doc", path: "../docs/frontend/DISENO-NAVEGACION-SIDEBAR.md" },
    ],
    priority: 1,
  },
  {
    id: "buscar-videos-filtros",
    title: "Buscar y filtrar videos",
    category: "navigation",
    tags: ["buscar", "filtrar", "videos", "lista", "busqueda"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/videos/page.tsx" },
      {
        type: "inline",
        content: `La pantalla Videos muestra todos los videos de la cuenta con:
- Barra de busqueda por titulo o numero de video
- Filtros por estado del pipeline (pendiente, en proceso, completado, error)
- Ordenamiento por fecha, numero o estado
- Vista de tabla con indicadores de pipeline (4 circulos de estado)`,
      },
    ],
    priority: 2,
  },
];

// =====================================================
// TROUBLESHOOTING
// =====================================================

const troubleshooting: KBSource[] = [
  {
    id: "pipeline-atascado",
    title: "Pipeline atascado - que hacer",
    category: "troubleshooting",
    tags: ["pipeline", "atascado", "error", "reintentar"],
    sources: [],
    priority: 1,
    skipIfExists: true,
  },
  {
    id: "reintentar-paso-fallido",
    title: "Como reintentar un paso fallido",
    category: "troubleshooting",
    tags: ["reintentar", "retry", "fallido", "error"],
    sources: [],
    priority: 1,
    skipIfExists: true,
  },
  {
    id: "errores-audio-comunes",
    title: "Errores comunes de audio y soluciones",
    category: "troubleshooting",
    tags: ["audio", "error", "elevenlabs", "voz", "solucion"],
    sources: [
      {
        type: "inline",
        content: `Errores comunes de audio en ContentFlow365:
1. Audio cortado o incompleto: El script de la escena es demasiado largo para ElevenLabs. Solucion: reducir la longitud del texto y regenerar.
2. Voz suena robotica: VoiceDNA no esta bien configurado. Solucion: agregar mas fuentes de VoiceDNA.
3. Audio no se genera: Creditos de ElevenLabs agotados. Solucion: verificar balance en elevenlabs.io.
4. Latencia alta: Muchas escenas generandose en paralelo. Solucion: esperar y reintentar.
5. Error de API: ElevenLabs temporalmente no disponible. Solucion: esperar 5 min y reintentar el paso.`,
      },
    ],
    priority: 1,
  },
  {
    id: "errores-video-heygen",
    title: "Errores de video HeyGen y soluciones",
    category: "troubleshooting",
    tags: ["video", "heygen", "avatar", "error", "solucion"],
    sources: [
      {
        type: "inline",
        content: `Errores comunes de video (HeyGen) en ContentFlow365:
1. Avatar no se genera: Creditos de HeyGen agotados. Solucion: verificar balance en heygen.com.
2. Video demasiado largo: HeyGen tiene limite por clip. Solucion: dividir en escenas mas cortas.
3. Lip-sync desincronizado: Audio corrupto o formato incompatible. Solucion: regenerar audio primero.
4. Error 429 (rate limit): Demasiadas solicitudes. Solucion: esperar 10 min y reintentar.
5. Avatar pixelado: Resolucion baja seleccionada. Solucion: verificar configuracion de calidad.`,
      },
    ],
    priority: 1,
  },
  {
    id: "errores-render-shotstack",
    title: "Errores de render Shotstack y soluciones",
    category: "troubleshooting",
    tags: ["render", "shotstack", "error", "solucion", "publicacion"],
    sources: [
      {
        type: "inline",
        content: `Errores comunes de render (Shotstack) en ContentFlow365:
1. Render falla: JSON de Shotstack malformado. Solucion: reintentar el paso de render.
2. URLs de assets expiradas: Los enlaces a videos/imagenes han caducado. Solucion: regenerar el paso anterior y luego render.
3. YouTube no publica: API quota excedida o credenciales invalidas. Solucion: verificar conexion YouTube en Settings.
4. Video muy largo (>20 min): Puede exceder limites de Shotstack. Solucion: contactar soporte.
5. Calidad baja: Configuracion de render en baja calidad. Solucion: verificar ajustes en Default Settings.`,
      },
    ],
    priority: 1,
  },
];

// =====================================================
// CHAT IA
// =====================================================

const chatIA: KBSource[] = [
  {
    id: "usar-chat-ia",
    title: "Como usar el chat de soporte IA",
    category: "chat",
    tags: ["chat", "ia", "soporte", "asistente", "ayuda"],
    sources: [
      { type: "component", path: "src/components/chat/chat-widget.tsx" },
      { type: "doc", path: "../docs/SOPORTE-CHAT-IA.md" },
    ],
    priority: 1,
  },
  {
    id: "que-puede-hacer-chat",
    title: "Que puede hacer el chat IA por ti",
    category: "chat",
    tags: ["chat", "funciones", "herramientas", "consultas", "comandos"],
    sources: [
      { type: "api", path: "src/lib/chat/tools.ts" },
      {
        type: "inline",
        content: `El chat IA de ContentFlow365 puede:
1. Consultar el estado de tus videos (pipeline completo)
2. Buscar videos por nombre, titulo o estado
3. Obtener informacion de tu cuenta
4. Buscar articulos de ayuda en la Knowledge Base
5. Reintentar pasos fallidos del pipeline (cuando tu lo pidas)
El chat conoce tu cuenta activa, tus videos recientes y recuerda conversaciones anteriores.`,
      },
    ],
    priority: 1,
  },
];

// =====================================================
// CAMPANAS
// =====================================================

const campanas: KBSource[] = [
  {
    id: "gestionar-campanas",
    title: "Gestionar campanas de marketing",
    category: "account",
    tags: ["campanas", "marketing", "ads", "reels", "publicidad"],
    sources: [
      { type: "route", path: "src/app/(app)/[client-slug]/campanas/page.tsx" },
      {
        type: "inline",
        content: `La seccion Campanas permite gestionar campanas de marketing y publicidad.
Se pueden crear y organizar campanas para Ads y Reels, con seguimiento de
rendimiento y metricas. Vinculada a la produccion de Reels y contenido publicitario.`,
      },
    ],
    priority: 2,
  },
];

// =====================================================
// EXPORT ALL SOURCES
// =====================================================

export const KB_SOURCES: KBSource[] = [
  ...gettingStarted,
  ...produccionYT,
  ...appData,
  ...remotion,
  ...account,
  ...navigation,
  ...troubleshooting,
  ...chatIA,
  ...campanas,
];

/** Get sources by category */
export function getSourcesByCategory(category: string): KBSource[] {
  return KB_SOURCES.filter((s) => s.category === category);
}

/** Get sources that should be generated (not skipped) */
export function getGeneratableSources(): KBSource[] {
  return KB_SOURCES.filter((s) => !s.skipIfExists);
}
