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
  Slide?: string;
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
        slide: r.fields.Slide || null,
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
        elevenlabs_text_v3_enhanced: null,
        audio_revisado_ok: r.fields["Audio Revisado OK"] || false,
        copy_revisado_ok: r.fields["Copy Revisado OK"] || false,
        informe_resumen_emoticonos: r.fields["Informe_Resumen_Emoticonos"] || null,
        solo_observaciones: r.fields["solo_observaciones"] || null,
        analisis_voz_1: r.fields["Analisis Voz 1"] || null,
        analisis_voz_2: r.fields["Analisis Voz 2"] || null,
        analisis_voz_3: r.fields["Analisis Voz 3"] || null,
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
