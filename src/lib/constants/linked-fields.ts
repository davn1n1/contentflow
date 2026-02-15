// Configuration for linked record fields across all App Data tables
// Maps: (parent table key, field name) → linked table key + primary field name + optional filter

export interface LinkedFieldDef {
  /** Table key in ALLOWED_TABLES (used for API calls) */
  table: string;
  /** Primary field name(s) to display as the record name */
  nameFields: string[];
  /** Image field name to show as thumbnail (attachment or S3 URL field) */
  imageField?: string;
  /** Optional Airtable formula filter for listing options */
  filter?: string;
  /** Whether this field allows multiple linked records */
  multiple?: boolean;
  /** Whether this table has 🏢Account for filtering (false = global/shared table) */
  hasAccount?: boolean;
}

/**
 * Map of parent table key → { fieldName → LinkedFieldDef }
 * Used by LinkedRecordSelector to know which table to query for each linked field.
 */
export const LINKED_FIELD_CONFIG: Record<string, Record<string, LinkedFieldDef>> = {
  "default-settings": {
    Persona: {
      table: "persona",
      nameFields: ["Name"],
      imageField: "Attachments",
      hasAccount: true,
    },
    VoiceDNA: {
      table: "voicedna",
      nameFields: ["VoiceName"],
      hasAccount: true,
    },
    "Avatares Sets Youtube": {
      table: "avatares-set",
      nameFields: ["Name"],
      imageField: "Attachments (from Avatar)",
      hasAccount: true,
    },
    "Avatares Sets Reels": {
      table: "avatares-set",
      nameFields: ["Name"],
      imageField: "Attachments (from Avatar)",
      hasAccount: true,
    },
    Intro: {
      table: "ctas",
      nameFields: ["Name", "Texto CTA"],
      filter: "OR({CTA/Intro}='Intro',{CTA/Intro}='')",
      hasAccount: true,
    },
    CTA: {
      table: "ctas",
      nameFields: ["Name", "Texto CTA"],
      filter: "OR({CTA/Intro}='CTA',{CTA/Intro}='')",
      hasAccount: true,
    },
    "Intro Broll": {
      table: "broll",
      nameFields: ["Id And Tags Summary"],
      imageField: "Broll Thumb",
      hasAccount: true,
    },
    "CTA Broll": {
      table: "broll",
      nameFields: ["Id And Tags Summary"],
      imageField: "Broll Thumb",
      hasAccount: true,
    },
    "Formato Diseño Slides": {
      table: "formato-diseno-slides",
      nameFields: ["Formato Diseño"],
      hasAccount: false, // Global table, no account filter
    },
    "Estilos Musicales": {
      table: "estilos-musicales",
      nameFields: ["style_en", "Descripción Principal"],
      hasAccount: false, // Global table, no account filter
    },
    "Cometario Pineado": {
      table: "comentario-pineado",
      nameFields: ["Name", "Texto"],
      hasAccount: true,
    },
  },
};

/**
 * Groups for visually organizing linked record fields in the drawer.
 * Each group has a title and an ordered list of field names.
 * Fields not in any group are shown ungrouped at the end.
 */
export interface LinkedFieldGroup {
  title: string;
  fields: string[];
}

export const LINKED_FIELD_GROUPS: Record<string, LinkedFieldGroup[]> = {
  "default-settings": [
    {
      title: "Avatar Set y Estilo Redacción (VoiceDNA) por defecto para Youtube",
      fields: ["Avatares Sets Youtube", "VoiceDNA"],
    },
    {
      title: "Avatar Set por defecto para Reels",
      fields: ["Avatares Sets Reels"],
    },
    {
      title: "Persona para Reels y Youtube",
      fields: ["Persona"],
    },
    {
      title: "Textos y Broll por defecto para Intro y CTA de Youtube",
      fields: ["Intro", "CTA", "Intro Broll", "CTA Broll"],
    },
    {
      title: "Elementos varios por defecto para Youtube",
      fields: ["Formato Diseño Slides", "Estilos Musicales", "Cometario Pineado"],
    },
  ],
};

/**
 * Get the linked field config for a specific parent table + field name.
 * Returns null if the field is not configured as editable.
 */
export function getLinkedFieldDef(
  parentTable: string,
  fieldName: string
): LinkedFieldDef | null {
  return LINKED_FIELD_CONFIG[parentTable]?.[fieldName] ?? null;
}

/**
 * Get the field groups for a parent table (if defined).
 */
export function getLinkedFieldGroups(
  parentTable: string
): LinkedFieldGroup[] | null {
  return LINKED_FIELD_GROUPS[parentTable] ?? null;
}
