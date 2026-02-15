// Configuration for linked record fields across all App Data tables
// Maps: (parent table key, field name) → linked table key + primary field name + optional filter

export interface LinkedFieldDef {
  /** Table key in ALLOWED_TABLES (used for API calls) */
  table: string;
  /** Primary field name(s) to display as the record name */
  nameFields: string[];
  /** Optional Airtable formula filter for listing options */
  filter?: string;
  /** Whether this field allows multiple linked records */
  multiple?: boolean;
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
    },
    VoiceDNA: {
      table: "voicedna",
      nameFields: ["VoiceName"],
    },
    "Avatares Sets Youtube": {
      table: "avatares-set",
      nameFields: ["Name"],
    },
    "Avatares Sets Reels": {
      table: "avatares-set",
      nameFields: ["Name"],
    },
    Intro: {
      table: "ctas",
      nameFields: ["Name", "Texto CTA"],
      filter: "OR({CTA/Intro}='Intro',{CTA/Intro}='')",
    },
    CTA: {
      table: "ctas",
      nameFields: ["Name", "Texto CTA"],
      filter: "OR({CTA/Intro}='CTA',{CTA/Intro}='')",
    },
    "Intro Broll": {
      table: "broll",
      nameFields: ["Id And Tags Summary"],
    },
    "CTA Broll": {
      table: "broll",
      nameFields: ["Id And Tags Summary"],
    },
    "Formato Diseño Slides": {
      table: "formato-diseno-slides",
      nameFields: ["Formato Diseño"],
    },
    "Estilos Musicales": {
      table: "estilos-musicales",
      nameFields: ["style_en", "Descripción Principal"],
    },
    "Cometario Pineado": {
      table: "comentario-pineado",
      nameFields: ["Name", "Texto"],
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
