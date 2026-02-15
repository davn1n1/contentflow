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
 * Get the linked field config for a specific parent table + field name.
 * Returns null if the field is not configured as editable.
 */
export function getLinkedFieldDef(
  parentTable: string,
  fieldName: string
): LinkedFieldDef | null {
  return LINKED_FIELD_CONFIG[parentTable]?.[fieldName] ?? null;
}
