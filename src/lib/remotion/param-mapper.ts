// Uses server-safe metadata (no React imports) so this file
// can be imported from API routes without triggering React context errors.
import { TEMPLATE_META } from "./templates/template-meta";

// ─── Airtable ↔ Remotion Props Mapper ──────────────────
//
// Converts between Airtable's generic Param_N system
// (Param_1_value..Param_11_value) and Remotion's typed template props.
//
// Only content + color props are mapped (text, colors).
// Timing and audio props use the template's defaults — they are
// internal to the animation and don't need per-scene customization.

const PARAM_GROUPS_TO_MAP: Set<string> = new Set(["content", "colors"]);

/**
 * Get the ordered list of mappable prop names for a template.
 * Returns { Param_1: "title", Param_2: "subtitle", ... }
 */
export function getParamNamesForTemplate(
  templateId: string
): Record<string, string> {
  const tpl = TEMPLATE_META[templateId];
  if (!tpl) throw new Error(`Template "${templateId}" not found in registry`);

  const mappable = tpl.propsMeta.filter((m) => PARAM_GROUPS_TO_MAP.has(m.group));
  const result: Record<string, string> = {};

  mappable.forEach((meta, i) => {
    if (i < 11) {
      result[`Param_${i + 1}`] = meta.key;
    }
  });

  return result;
}

/**
 * Convert AE Renders Param_1_value..Param_11_value into
 * Remotion template props using the param names from the template definition.
 *
 * @param templateId - Registry key (e.g. "text-reveal")
 * @param paramNames - Param_1..Param_11 from After Effects Templates (prop key names)
 * @param paramValues - Param_1_value..Param_11_value from AE Renders (concrete values)
 */
export function airtableParamsToRemotionProps(
  templateId: string,
  paramNames: (string | null)[],
  paramValues: (string | null)[]
): Record<string, unknown> {
  const tpl = TEMPLATE_META[templateId];
  if (!tpl) throw new Error(`Template "${templateId}" not found in registry`);

  // Start with all defaults (including timing/audio)
  const props: Record<string, unknown> = { ...tpl.defaultProps };

  for (let i = 0; i < Math.min(paramNames.length, paramValues.length, 11); i++) {
    const name = paramNames[i];
    const value = paramValues[i];
    if (!name || value == null || value === "") continue;

    // Find the prop meta to determine type for coercion
    const meta = tpl.propsMeta.find((m) => m.key === name);
    if (!meta) {
      // Unknown prop — store as string anyway
      props[name] = value;
      continue;
    }

    switch (meta.type) {
      case "timing":
      case "volume":
        props[name] = parseFloat(value) || 0;
        break;
      case "color":
        // Hex color — store as-is
        props[name] = value;
        break;
      case "text":
      default:
        props[name] = value;
        break;
    }
  }

  return props;
}

/**
 * Convert Remotion props back to Airtable Param_1_value..Param_11_value.
 * Uses the same ordering as getParamNamesForTemplate().
 */
export function remotionPropsToAirtableParams(
  templateId: string,
  props: Record<string, unknown>
): Record<string, string> {
  const paramNames = getParamNamesForTemplate(templateId);
  const result: Record<string, string> = {};

  for (const [paramKey, propName] of Object.entries(paramNames)) {
    const val = props[propName];
    if (val != null && val !== "") {
      // paramKey is "Param_1", we need "Param_1_value"
      result[`${paramKey}_value`] = String(val);
    }
  }

  return result;
}

/**
 * Get template metadata for display purposes.
 * Returns the template definition if it exists in the registry.
 */
export function getTemplateInfo(templateId: string) {
  return TEMPLATE_META[templateId] || null;
}
