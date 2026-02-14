// ─── Types ───────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  creditsPerEuro: number;
  features: string[];
  stripeUrl?: string;
}

export interface CreditService {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  platforms: string[];
}

export interface ServiceGroup {
  id: string;
  name: string;
  services: CreditService[];
}

export interface CreditItem {
  service_id: string;
  slug: string;
  name: string;
  credit_cost: number;
  quantity: number;
}

export interface FAQCategory {
  id: string;
  title: string;
  items: { question: string; answer: string }[];
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 990,
    credits: 10_000,
    creditsPerEuro: 10.1,
    features: [
      "10.000 créditos/mes",
      "Todos los formatos de video",
      "Renderizado prioritario",
      "Soporte por email",
    ],
    stripeUrl: "https://buy.stripe.com/bJedR22B16qaaNe1GcgrS01",
  },
  {
    id: "growth",
    name: "Growth",
    price: 1_990,
    credits: 21_000,
    creditsPerEuro: 10.55,
    features: [
      "21.000 créditos/mes",
      "Todos los formatos + avatares",
      "Renderizado express",
      "Soporte prioritario",
      "Sesión estrategia mensual 1:1",
    ],
    stripeUrl: "https://buy.stripe.com/5kQfZa3F515Q5sUacIgrS03",
  },
  {
    id: "scale",
    name: "Scale",
    price: 2_990,
    credits: 35_000,
    creditsPerEuro: 11.71,
    features: [
      "35.000 créditos/mes",
      "Todo ilimitado",
      "Render dedicado",
      "Account manager dedicado",
      "Sesión estrategia semanal",
    ],
    stripeUrl: "https://buy.stripe.com/bJe5kw8ZpbKu6wY58EgrS04",
  },
];

// ─── Service Groups ──────────────────────────────────────────────────────────

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "grupo-a",
    name: "Grupo A: Reels y Ads",
    services: [
      {
        id: "video-short",
        slug: "video-short",
        name: "Video Short",
        description: "Video corto para Reels, TikTok o Ads (15-60s)",
        creditCost: 156,
        platforms: ["Instagram", "Facebook", "TikTok", "YT Shorts", "LinkedIn", "Twitter", "Threads"],
      },
      {
        id: "render-short",
        slug: "render-short",
        name: "Render Short",
        description: "Renderizado y postproducción de video corto",
        creditCost: 95,
        platforms: ["Instagram", "TikTok", "YT Shorts"],
      },
    ],
  },
  {
    id: "grupo-b",
    name: "Grupo B: Youtube Long",
    services: [
      {
        id: "video-long",
        slug: "video-long",
        name: "Video Long",
        description: "Video largo para YouTube (5-15 min)",
        creditCost: 542,
        platforms: ["YouTube"],
      },
      {
        id: "render-long",
        slug: "render-long",
        name: "Render Long",
        description: "Renderizado y postproducción de video largo",
        creditCost: 157,
        platforms: ["YouTube"],
      },
    ],
  },
  {
    id: "grupo-c",
    name: "Grupo C: Video Hooks Tendencia",
    services: [
      {
        id: "hook-veo3",
        slug: "hook-veo3",
        name: "Hook Veo3",
        description: "Hook de tendencia generado con IA",
        creditCost: 48,
        platforms: ["Instagram", "TikTok", "YouTube"],
      },
    ],
  },
  {
    id: "grupo-d",
    name: "Grupo D: Avatares",
    services: [
      {
        id: "persona-shorts",
        slug: "persona-shorts",
        name: "N. Personas Shorts",
        description: "Avatar IA personalizado para videos cortos",
        creditCost: 1_660,
        platforms: ["Instagram", "TikTok"],
      },
      {
        id: "persona-youtube",
        slug: "persona-youtube",
        name: "N. Personas Youtube",
        description: "Avatar IA personalizado para videos largos",
        creditCost: 2_925,
        platforms: ["YouTube"],
      },
    ],
  },
];

// ─── FAQs ────────────────────────────────────────────────────────────────────

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "funcionalidades",
    title: "Funcionalidades",
    items: [
      {
        question: "¿Qué tipos de video puedo crear con ContentFlow365?",
        answer:
          "Puedes crear Reels, TikToks, YouTube Shorts, videos largos de YouTube (5-15 min), hooks de tendencia con IA, y contenido con avatares IA personalizados. Todos los formatos están optimizados para cada plataforma.",
      },
      {
        question: "¿Puedo personalizar los avatares de IA?",
        answer:
          "Sí, creamos avatares hiper-realistas o virtuales entrenados con tu imagen y voz. El avatar puede hablar en múltiples idiomas manteniendo tu estilo personal.",
      },
    ],
  },
  {
    id: "plan-creditos",
    title: "Plan & Créditos",
    items: [
      {
        question: "¿Cómo funcionan los créditos?",
        answer:
          "Cada plan incluye una cantidad mensual de créditos. Cada tipo de contenido consume una cantidad diferente de créditos. Por ejemplo, un Video Short consume 156 créditos y un Video Long 542 créditos. Puedes distribuir tus créditos como prefieras.",
      },
      {
        question: "¿Qué pasa si me quedo sin créditos?",
        answer:
          "Puedes comprar packs de créditos adicionales en cualquier momento. También puedes actualizar tu plan para obtener más créditos mensuales.",
      },
      {
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer:
          "Sí, puedes actualizar o cambiar tu plan cuando quieras. Los cambios se aplican en el siguiente ciclo de facturación. No hay penalización por cambiar.",
      },
      {
        question: "¿Los créditos no utilizados se acumulan?",
        answer:
          "Los créditos son mensuales y no se acumulan de un mes a otro. Te recomendamos planificar tu producción para aprovechar al máximo tu plan.",
      },
      {
        question: "¿Cuál es la diferencia entre Video y Render?",
        answer:
          "El 'Video' incluye la creación completa del contenido (guión IA, audio, avatar/b-roll). El 'Render' es la postproducción final (edición, efectos, subtítulos, exportación). Ambos son necesarios para el producto final.",
      },
      {
        question: "¿Puedo probar antes de comprometerme?",
        answer:
          "Ofrecemos una garantía de satisfacción de 30 días. Si no estás satisfecho, te devolvemos el importe íntegro sin preguntas.",
      },
    ],
  },
  {
    id: "produccion-calidad",
    title: "Producción & Calidad",
    items: [
      {
        question: "¿Cuánto tarda en producirse un video?",
        answer:
          "Un video corto (Reel/Short) se produce en menos de 15 minutos. Un video largo de YouTube tarda entre 30-60 minutos. Los avatares personalizados requieren una configuración inicial de 24-48h.",
      },
      {
        question: "¿Qué calidad tienen los videos?",
        answer:
          "Todos los videos se producen en alta calidad (1080p para Shorts, hasta 4K para YouTube). Incluyen subtítulos automáticos, efectos de tendencia, y están optimizados para cada plataforma.",
      },
      {
        question: "¿Puedo revisar y editar antes de publicar?",
        answer:
          "Sí, tienes acceso a un editor visual donde puedes previsualizar, ajustar y aprobar cada video antes de publicarlo. Nada se publica sin tu aprobación.",
      },
      {
        question: "¿En qué idiomas funcionan los videos?",
        answer:
          "Soportamos más de 30 idiomas para voces IA y subtítulos. Los avatares pueden hablar en cualquier idioma manteniendo la sincronización labial perfecta.",
      },
      {
        question: "¿Qué plataformas están soportadas?",
        answer:
          "Instagram (Reels, Stories), TikTok, YouTube (Shorts y Long), Facebook, LinkedIn, Twitter/X, Threads, y Blue Sky. Cada video se optimiza automáticamente para la plataforma destino.",
      },
    ],
  },
  {
    id: "facturacion-pagos",
    title: "Facturación & Pagos",
    items: [
      {
        question: "¿Qué métodos de pago aceptan?",
        answer:
          "Aceptamos tarjeta de crédito/débito (Visa, Mastercard, Amex) y transferencia bancaria. El pago es mensual o puedes elegir pago trimestral o semestral con descuento.",
      },
      {
        question: "¿Puedo cancelar en cualquier momento?",
        answer:
          "Sí, sin compromiso de permanencia. Puedes cancelar cuando quieras y seguirás teniendo acceso hasta el final del período pagado.",
      },
    ],
  },
  {
    id: "seguridad-soporte",
    title: "Seguridad & Soporte",
    items: [
      {
        question: "¿Mis datos están seguros?",
        answer:
          "Utilizamos encriptación de nivel bancario (SSL/TLS). Tus datos, voces y avatares son exclusivamente tuyos y nunca se comparten con terceros. Cumplimos con GDPR.",
      },
      {
        question: "¿Qué soporte ofrecen?",
        answer:
          "Plan Pro: soporte por email (respuesta en 24h). Plan Growth: soporte prioritario + sesión estrategia mensual. Plan Scale: account manager dedicado + soporte inmediato + sesión estrategia semanal.",
      },
    ],
  },
];

// ─── Loading steps ───────────────────────────────────────────────────────────

export const LOADING_STEPS = [
  "Conectando con tu análisis...",
  "Procesando datos de la reunión...",
  "Generando propuesta personalizada...",
  "Calculando presupuesto óptimo...",
  "¡Listo! Preparando tu experiencia...",
];
