import { NextRequest, NextResponse } from "next/server";
import { airtableFetchByIds, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const SCENE_FIELDS = [
  "N. Escena", "Clasificación Escena", "Start", "End", "Duration",
  "Script", "Role", "Importance", "Camera",
  "Slide", "Broll", "Topic", "Status", "URL Slide S3",
  "URL Camera S3", "Voice S3", "Voice Length",
  "Status Audio", "Status Camera", "Status Script",
  "Audio Revisado OK", "Copy Revisado OK",
  "Informe_Resumen_Emoticonos", "solo_observaciones",
  "Script Elevenlabs", "Analisis Voz 1", "Analisis Voz 2", "Analisis Voz 3",
  "Feedback Audio Elevenlabs", "ElevenLabs Text v3 Enhanced",
  // Montaje / Slide fields
  "Slide Activa", "StatusSlide", "SlideEngine",
  "Feedback Slide", "Prompt Slide",
  "Calificacion Imagen Final",
  // Broll fields (lookups include "(from Videos Broll)" in name)
  "Broll Thumb (from Videos Broll)", "Broll Activa",
  "URL Broll S3 (from Videos Broll)",
  "Broll Offset", "Broll Duration",
  "Custom (from Videos Broll)", "Broll_Video (from Videos Broll)",
  // Camera / Avatar fields (lookups include full path)
  "Zoom Camera",
  "Tipo Avatar (from Avatares) (from Camera Table)",
  "Photo S3 Avatar IV (from Avatares) (from Camera Table)",
];

interface SceneFields {
  "N. Escena"?: string;
  "Clasificación Escena"?: string;
  Start?: number;
  End?: number;
  Duration?: number;
  Script?: string;
  Role?: string;
  Importance?: string;
  Camera?: string[];
  Slide?: { url: string; thumbnails?: { large?: { url: string } } }[];
  Broll?: string;
  Topic?: string;
  Status?: string;
  "URL Slide S3"?: string;
  "URL Camera S3"?: string;
  "Voice S3"?: string;
  "Voice Length"?: number;
  "Status Audio"?: string;
  "Status Camera"?: string;
  "Status Script"?: string;
  "Audio Revisado OK"?: boolean;
  "Copy Revisado OK"?: boolean;
  "Informe_Resumen_Emoticonos"?: string;
  "solo_observaciones"?: string;
  "Script Elevenlabs"?: string;
  "Analisis Voz 1"?: string;
  "Analisis Voz 2"?: string;
  "Analisis Voz 3"?: string;
  "Feedback Audio Elevenlabs"?: string;
  "ElevenLabs Text v3 Enhanced"?: string;
  // Montaje / Slide fields
  "Slide Activa"?: boolean;
  "StatusSlide"?: string;
  "SlideEngine"?: string;
  "Feedback Slide"?: string;
  "Prompt Slide"?: string;
  "Calificacion Imagen Final"?: string;
  // Broll fields
  "Broll Thumb (from Videos Broll)"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "Broll Activa"?: boolean;
  "URL Broll S3 (from Videos Broll)"?: string[];
  "Broll Offset"?: number;
  "Broll Duration"?: number;
  "Custom (from Videos Broll)"?: (boolean | null)[];
  "Broll_Video (from Videos Broll)"?: string[];
  // Camera / Avatar fields
  "Zoom Camera"?: string;
  "Tipo Avatar (from Avatares) (from Camera Table)"?: string[];
  "Photo S3 Avatar IV (from Avatares) (from Camera Table)"?: string[];
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
    }

    const recordIds = ids.split(",").filter(Boolean);
    const records = await airtableFetchByIds<SceneFields>(
      TABLES.ESCENAS,
      recordIds,
      SCENE_FIELDS
    );

    // Sort by scene number
    const scenes = records
      .map((r) => ({
        id: r.id,
        account_id: null,
        n_escena: parseInt(r.fields["N. Escena"] || "0", 10),
        clasificación_escena: r.fields["Clasificación Escena"] || null,
        start: r.fields.Start || null,
        end: r.fields.End || null,
        duration: r.fields.Duration || null,
        script: r.fields.Script || null,
        script_elevenlabs: r.fields["Script Elevenlabs"] || null,
        role: r.fields.Role || null,
        importance: r.fields.Importance || null,
        camera: null,
        slide: r.fields.Slide?.[0]?.thumbnails?.large?.url || r.fields.Slide?.[0]?.url || null,
        slide_full: r.fields.Slide?.[0]?.url || null,
        broll: r.fields.Broll || null,
        topic: r.fields.Topic || null,
        status: r.fields.Status || null,
        url_slide_s3: r.fields["URL Slide S3"] || null,
        url_camera_s3: r.fields["URL Camera S3"] || null,
        url_broll: null,
        voice_s3: r.fields["Voice S3"] || null,
        voice_s3_nivelada: null,
        voice_length: r.fields["Voice Length"] || null,
        status_audio: r.fields["Status Audio"] || null,
        status_camera: r.fields["Status Camera"] || null,
        status_script: r.fields["Status Script"] || null,
        audio_revisado_ok: r.fields["Audio Revisado OK"] || false,
        copy_revisado_ok: r.fields["Copy Revisado OK"] || false,
        informe_resumen_emoticonos: r.fields["Informe_Resumen_Emoticonos"] || null,
        solo_observaciones: r.fields["solo_observaciones"] || null,
        analisis_voz_1: r.fields["Analisis Voz 1"] || null,
        analisis_voz_2: r.fields["Analisis Voz 2"] || null,
        analisis_voz_3: r.fields["Analisis Voz 3"] || null,
        feedback_audio: r.fields["Feedback Audio Elevenlabs"] || null,
        elevenlabs_text_v3_enhanced: r.fields["ElevenLabs Text v3 Enhanced"] || null,
        // Montaje / Slide fields
        slide_activa: r.fields["Slide Activa"] || false,
        status_slide: r.fields["StatusSlide"] || null,
        slide_engine: r.fields["SlideEngine"] || null,
        feedback_slide: r.fields["Feedback Slide"] || null,
        prompt_slide: r.fields["Prompt Slide"] || null,
        calificacion_imagen_final: r.fields["Calificacion Imagen Final"] || null,
        // Broll fields (lookup names include "(from Videos Broll)")
        broll_thumb: r.fields["Broll Thumb (from Videos Broll)"]?.[0]?.thumbnails?.large?.url || r.fields["Broll Thumb (from Videos Broll)"]?.[0]?.url || null,
        broll_activa: r.fields["Broll Activa"] || false,
        url_broll_s3: (() => {
          const v = r.fields["URL Broll S3 (from Videos Broll)"];
          if (Array.isArray(v)) return v[0] || null;
          return null;
        })(),
        broll_offset: r.fields["Broll Offset"] ?? null,
        broll_duration: r.fields["Broll Duration"] ?? null,
        broll_custom: (() => {
          const c = r.fields["Custom (from Videos Broll)"];
          if (!Array.isArray(c) || c.length === 0) return false;
          // Custom is a checkbox/boolean in Videos Broll table
          return c[0] === true;
        })(),
        broll_video: (() => {
          const v = r.fields["Broll_Video (from Videos Broll)"];
          if (Array.isArray(v) && v.length > 0) {
            const first = v[0];
            // Could be attachment or URL string
            if (typeof first === "object" && first !== null && "url" in first) return first.url || null;
            if (typeof first === "string" && first.startsWith("http")) return first;
          }
          return null;
        })(),
        // Camera / Avatar fields (lookup names include full path)
        zoom_camera: r.fields["Zoom Camera"] || null,
        tipo_avatar: (() => {
          const v = r.fields["Tipo Avatar (from Avatares) (from Camera Table)"];
          return Array.isArray(v) ? v[0] || null : null;
        })(),
        photo_avatar: (() => {
          const v = r.fields["Photo S3 Avatar IV (from Avatares) (from Camera Table)"];
          if (Array.isArray(v) && v.length > 0) {
            const first = v[0];
            if (typeof first === "object" && first !== null && "url" in first) return first.thumbnails?.large?.url || first.url || null;
            if (typeof first === "string" && first.startsWith("http")) return first;
          }
          return null;
        })(),
        camera_table_id: null,
        audio_id: null,
      }))
      .sort((a, b) => a.n_escena - b.n_escena);

    return NextResponse.json(scenes);
  } catch (error) {
    console.error("Airtable scenes error:", error);
    return NextResponse.json({ error: "Failed to fetch scenes" }, { status: 500 });
  }
}

// PATCH: Update a scene field (Script, etc.)
export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "fields required" }, { status: 400 });
    }

    const updated = await airtableUpdate<SceneFields>(TABLES.ESCENAS, id, fields);
    return NextResponse.json({ id: updated.id, ok: true });
  } catch (error) {
    console.error("Airtable scene update error:", error);
    return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  }
}
