"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Loader2,
  Save,
  ExternalLink,
  ImageIcon,
  FileText,
  ToggleLeft,
  Check,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface AppDataRecord {
  id: string;
  createdTime: string;
  [key: string]: unknown;
}

// Fields to hide from the detail view
const HIDDEN_FIELDS = new Set([
  "id", "createdTime", "🏢Account", "AccountRecordID",
  "Account Record ID", "Last Modified", "Last Modified By",
]);

// Fields that should not be editable
function isReadOnlyField(key: string, value: unknown): boolean {
  if (HIDDEN_FIELDS.has(key)) return true;
  if (key.includes("(from ")) return true;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string" && first.startsWith("rec")) return true;
    if (typeof first === "object" && first !== null && "url" in first) return true;
  }
  return false;
}

function isAttachment(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    "url" in value[0]
  );
}

interface LinkedRecordDetailProps {
  recordId: string;
  table: string;
  accountId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function LinkedRecordDetail({
  recordId,
  table,
  accountId,
  onClose,
  onSaved,
}: LinkedRecordDetailProps) {
  const pathname = usePathname();
  const [record, setRecord] = useState<AppDataRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedFields, setEditedFields] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Extract client slug from pathname
  const slug = pathname?.split("/")[1] || "";
  const appDataUrl = `/${slug}/app-data/${table}`;

  // Fetch the full record
  useEffect(() => {
    setLoading(true);
    setEditedFields({});
    setSaveStatus("idle");
    const params = new URLSearchParams({ table, id: recordId });
    if (accountId) params.set("accountId", accountId);
    fetch(`/api/data/app-data?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setRecord(data as AppDataRecord);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [recordId, table, accountId]);

  const hasChanges = Object.keys(editedFields).length > 0;

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }, []);

  const handleSave = async () => {
    if (!record || !hasChanges) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/data/app-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, recordId: record.id, fields: editedFields }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setRecord(updated as AppDataRecord);
      setEditedFields({});
      setSaveStatus("success");
      onSaved?.();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Build visible fields
  const fields = record
    ? Object.entries(record).filter(
        ([key]) => !HIDDEN_FIELDS.has(key) && key !== "id" && key !== "createdTime"
      )
    : [];

  const recordName = record
    ? String(record.Name || record.name || record.Nombre || record.VoiceName || record["Formato Diseño"] || record["Id And Tags Summary"] || record.id)
    : "";

  // Find first image attachment for header
  const headerImage = record
    ? fields.find(([, v]) => isAttachment(v))?.[1] as Array<{ url?: string; thumbnails?: { large?: { url: string } } }> | undefined
    : undefined;
  const headerImageUrl = headerImage?.[0]?.thumbnails?.large?.url || headerImage?.[0]?.url;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            {headerImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={headerImageUrl}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-border/50 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando registro...</span>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {recordName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{table}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={appDataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border"
              title="Abrir en App Data"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              App Data
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !record ? (
            <div className="text-center py-12 text-muted-foreground">
              No se pudo cargar el registro
            </div>
          ) : (
            <>
              {/* Image attachments */}
              {fields
                .filter(([, v]) => isAttachment(v))
                .map(([key, value]) => {
                  const attachments = value as Array<{
                    url?: string;
                    filename?: string;
                    thumbnails?: { large?: { url: string }; small?: { url: string } };
                  }>;
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <ImageIcon className="w-3 h-3" />
                        {key}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={i}
                            src={att.thumbnails?.large?.url || att.url || ""}
                            alt={att.filename || ""}
                            className="w-20 h-20 rounded-lg object-cover border border-border"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Text, number, boolean, and other fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {fields
                  .filter(([, v]) => !isAttachment(v))
                  .map(([key, originalValue]) => {
                    const readOnly = isReadOnlyField(key, originalValue);
                    const currentValue = key in editedFields ? editedFields[key] : originalValue;

                    // Boolean
                    if (typeof originalValue === "boolean" || (typeof originalValue === "number" && (originalValue === 0 || originalValue === 1) && (key.toLowerCase().includes("activ") || key.toLowerCase().includes("enabl") || key.includes("?")))) {
                      const isOn = !!currentValue;
                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all",
                            isOn ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</span>
                          </div>
                          {readOnly ? (
                            <span className={cn("text-xs font-semibold", isOn ? "text-emerald-400" : "text-muted-foreground")}>
                              {isOn ? "Sí" : "No"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleFieldChange(key, !currentValue)}
                              className={cn(
                                "relative w-10 h-5 rounded-full transition-colors",
                                isOn ? "bg-primary" : "bg-muted-foreground/30"
                              )}
                            >
                              <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm", isOn ? "translate-x-5" : "translate-x-1")} />
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Number
                    if (typeof originalValue === "number") {
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                          {readOnly ? (
                            <p className="text-sm font-medium text-foreground tabular-nums">
                              {currentValue != null ? Number(currentValue).toLocaleString() : "—"}
                            </p>
                          ) : (
                            <input
                              type="number"
                              value={currentValue != null ? String(currentValue) : ""}
                              onChange={(e) => handleFieldChange(key, e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          )}
                        </div>
                      );
                    }

                    // Array of strings (tags)
                    if (Array.isArray(originalValue) && originalValue.every((v) => typeof v === "string" && !v.startsWith("rec"))) {
                      return (
                        <div key={key} className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                          <div className="flex flex-wrap gap-1">
                            {(originalValue as string[]).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // String (short or long)
                    const strVal = currentValue != null ? String(currentValue) : "";
                    const isLong = strVal.length > 100 || typeof originalValue === "string" && originalValue.includes("\n");

                    return (
                      <div key={key} className={cn("space-y-1", isLong && "sm:col-span-2")}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                          {readOnly && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Solo lectura</span>
                          )}
                        </div>
                        {readOnly ? (
                          isLong ? (
                            <div className="flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">{strVal || "—"}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground truncate">{strVal || "—"}</p>
                          )
                        ) : isLong ? (
                          <textarea
                            value={strVal}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                          />
                        ) : (
                          <input
                            type="text"
                            value={strVal}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {record && (
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {saveStatus === "success" && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" /> Guardado
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive">Error al guardar</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {hasChanges ? "Cancelar" : "Cerrar"}
              </button>
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
