// Spanish label mappings for YouTube Analytics API dimensions
// Ported from standalone dashboard (youtube-dashboard.html)

export const GENDER_LABELS: Record<string, string> = {
  MALE: "Hombres",
  FEMALE: "Mujeres",
  USER_SPECIFIED: "Otro",
};

export const COUNTRY_LABELS: Record<string, string> = {
  ES: "Espana",
  MX: "Mexico",
  CO: "Colombia",
  AR: "Argentina",
  US: "EEUU",
  PE: "Peru",
  CL: "Chile",
  EC: "Ecuador",
  VE: "Venezuela",
  GT: "Guatemala",
  DO: "Rep. Dominicana",
  BO: "Bolivia",
  CR: "Costa Rica",
  UY: "Uruguay",
  PY: "Paraguay",
  PA: "Panama",
  HN: "Honduras",
  SV: "El Salvador",
  NI: "Nicaragua",
  CU: "Cuba",
  BR: "Brasil",
  DE: "Alemania",
  FR: "Francia",
  GB: "Reino Unido",
  IT: "Italia",
  PT: "Portugal",
};

export const TRAFFIC_SOURCE_LABELS: Record<string, string> = {
  ADVERTISING: "Publicidad",
  ANNOTATION: "Anotaciones",
  CAMPAIGN_CARD: "Tarjetas",
  END_SCREEN: "Pantalla final",
  EXT_URL: "URL externa",
  HASHTAGS: "Hashtags",
  NOTIFICATION: "Notificaciones",
  NO_LINK_EMBEDDED: "Embebido",
  NO_LINK_OTHER: "Otro",
  PLAYLIST: "Playlists",
  PROMOTED: "Promocionado",
  RELATED_VIDEO: "Videos relacionados",
  SHORTS: "Shorts",
  SUBSCRIBER: "Suscriptores",
  YT_CHANNEL: "Canal YT",
  YT_OTHER_PAGE: "Otra pagina YT",
  YT_PLAYLIST_PAGE: "Pagina playlist",
  YT_SEARCH: "Busqueda YT",
};

export const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: "Desktop",
  GAME_CONSOLE: "Consola",
  MOBILE: "Movil",
  TABLET: "Tablet",
  TV: "Smart TV",
  UNKNOWN_PLATFORM: "Otro",
};

// Color palette for donut charts (8 colors + rest)
export const CHART_COLORS = [
  "#0a84ff",
  "#ff6482",
  "#bf5af2",
  "#30d158",
  "#ff9f0a",
  "#64d2ff",
  "#ff453a",
  "#ffd60a",
  "#5e5ce6",
];
