"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { AppDataRecord } from "@/lib/hooks/use-app-data";
import {
  X,
  Save,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Copy,
  AlertTriangle,
  FileText,
  Link2,
  ToggleLeft,
  Hash,
  Tag,
  Globe,
  Info,
  Paperclip,
} from "lucide-react";
import { getLinkedFieldDef, getLinkedFieldGroups } from "@/lib/constants/linked-fields";
import { LinkedRecordSelector } from "@/components/app-data/linked-record-selector";

// Tag color palette
const TAG_COLORS = [
  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20",
  "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Fields that should not be shown
const HIDDEN_FIELDS = new Set(["id", "createdTime"]);

function shouldHideField(key: string): boolean {
  const lower = key.toLowerCase();
  if (HIDDEN_FIELDS.has(key)) return true;
  if (lower === "account" || lower === "🏢account") return true;
  if (lower.includes("nameapp (from")) return true;
  if (lower.includes("user (from collaborators)")) return true;
  return false;
}

// ─── Field type classification ─────────────────────────
type FieldType = "image" | "attachment" | "linked_record" | "tags" | "boolean" | "number" | "url" | "long_text" | "short_text" | "status";

function isAttachmentArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (typeof first !== "object" || first === null) return false;
  // Airtable attachments always have: id, url, filename
  return "url" in first && ("filename" in first || "id" in first);
}

function isImageAttachment(att: Record<string, unknown>): boolean {
  // Check MIME type first (most reliable)
  const type = att.type as string | undefined;
  if (type && typeof type === "string" && type.startsWith("image/")) return true;
  // Check filename extension
  const filename = att.filename as string | undefined;
  if (filename && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff?|avif)$/i.test(filename)) return true;
  // Check if it has width/height (only images have these in Airtable)
  if (typeof att.width === "number" && typeof att.height === "number") return true;
  // Check if thumbnails have "full" key (only images)
  const thumbs = att.thumbnails as Record<string, unknown> | undefined;
  if (thumbs && "full" in thumbs) return true;
  return false;
}

function classifyField(key: string, value: unknown): FieldType {
  if (value == null || value === "") return "short_text";

  // Attachment fields (images, PDFs, etc.)
  if (isAttachmentArray(value)) {
    const arr = value as Record<string, unknown>[];
    const hasImage = arr.some(isImageAttachment);
    return hasImage ? "image" : "attachment";
  }
  // Linked records (array of recXXX IDs)
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string" && value[0].startsWith("rec")) {
    return "linked_record";
  }
  // Tags / multi-select
  if (Array.isArray(value) && value.length > 0) return "tags";
  // Boolean
  if (typeof value === "boolean") return "boolean";
  // Number
  if (typeof value === "number") return "number";
  // Status-like fields
  const lower = key.toLowerCase();
  if (lower === "status" || lower === "estado") return "status";
  // String values
  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) return "url";
    if (value.length > 100) return "long_text";
  }
  return "short_text";
}

function isReadOnly(key: string, value: unknown, parentTable?: string): boolean {
  if (HIDDEN_FIELDS.has(key)) return true;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string" && value[0].startsWith("rec")) {
    // Allow editing if field has a linked field config
    if (parentTable && getLinkedFieldDef(parentTable, key)) return false;
    return true;
  }
  if (isAttachmentArray(value)) return true;
  if (key.includes("(from ")) return true;
  return false;
}

// ─── Field Groups (8 thematic sections) ─────────────────
interface FieldGroups {
  images: [string, unknown][];
  accountLogo: [string, unknown][];
  attachments: [string, unknown][];
  info: [string, unknown][];
  status: [string, unknown][];
  numbers: [string, unknown][];
  urls: [string, unknown][];
  booleans: [string, unknown][];
  linkedRecords: [string, unknown][];
  tags: [string, unknown][];
  longText: [string, unknown][];
}

// Account logo lookup fields — deprioritized to the bottom
function isAccountLogoField(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.includes("logo") && lower.includes("(from") && lower.includes("account");
}

function groupFields(record: AppDataRecord): FieldGroups {
  const groups: FieldGroups = {
    images: [],
    accountLogo: [],
    attachments: [],
    info: [],
    status: [],
    numbers: [],
    urls: [],
    booleans: [],
    linkedRecords: [],
    tags: [],
    longText: [],
  };

  for (const [key, value] of Object.entries(record)) {
    if (shouldHideField(key)) continue;
    const type = classifyField(key, value);
    // Account logo → separate small section at the bottom
    if (type === "image" && isAccountLogoField(key)) {
      groups.accountLogo.push([key, value]);
      continue;
    }
    switch (type) {
      case "image": groups.images.push([key, value]); break;
      case "attachment": groups.attachments.push([key, value]); break;
      case "linked_record": groups.linkedRecords.push([key, value]); break;
      case "tags": groups.tags.push([key, value]); break;
      case "boolean": groups.booleans.push([key, value]); break;
      case "number": groups.numbers.push([key, value]); break;
      case "url": groups.urls.push([key, value]); break;
      case "status": groups.status.push([key, value]); break;
      case "long_text": groups.longText.push([key, value]); break;
      default: groups.info.push([key, value]); break;
    }
  }
  return groups;
}

// ─── Main Component ──────────────────────────────────────

interface RecordEditDrawerProps {
  record: AppDataRecord | null;
  table: string;
  accountId?: string;
  onClose: () => void;
  /** When true, renders with higher z-index for nested (expand linked record) drawers */
  nested?: boolean;
}

export function RecordEditDrawer({ record, table, accountId, onClose, nested = false }: RecordEditDrawerProps) {
  const queryClient = useQueryClient();
  const [editedFields, setEditedFields] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Nested linked record expansion
  const [expandedLinked, setExpandedLinked] = useState<{ recordId: string; table: string } | null>(null);
  const [expandedLinkedData, setExpandedLinkedData] = useState<AppDataRecord | null>(null);
  const [loadingExpanded, setLoadingExpanded] = useState(false);

  useEffect(() => {
    setEditedFields({});
    setSaveStatus("idle");
    setShowUnsavedWarning(false);
    setExpandedLinked(null);
    setExpandedLinkedData(null);
  }, [record?.id]);

  const hasChanges = Object.keys(editedFields).length > 0;

  const fieldGroups = useMemo(() => {
    if (!record) return null;
    return groupFields(record);
  }, [record]);

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
      setSaveStatus("success");
      // Wait for refetch to complete before clearing local edits,
      // so the parent's selectedRecord syncs with fresh data first
      await queryClient.invalidateQueries({ queryKey: ["app-data", table] });
      setEditedFields({});
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Expand a linked record into a nested drawer
  const handleExpandLinkedRecord = useCallback((recordId: string, linkedTable: string) => {
    setExpandedLinked({ recordId, table: linkedTable });
    setExpandedLinkedData(null);
    setLoadingExpanded(true);
    fetch(`/api/data/app-data?table=${encodeURIComponent(linkedTable)}&id=${encodeURIComponent(recordId)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => setExpandedLinkedData(data as AppDataRecord))
      .catch((err) => {
        console.error("Failed to fetch linked record:", err);
        setExpandedLinked(null);
      })
      .finally(() => setLoadingExpanded(false));
  }, []);

  const closeExpandedLinked = useCallback(() => {
    setExpandedLinked(null);
    setExpandedLinkedData(null);
  }, []);

  const attemptClose = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    setEditedFields({});
    onClose();
  };

  const handleCopy = (key: string, value: unknown) => {
    navigator.clipboard.writeText(String(value));
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (!record) return null;

  const recordName = String(record.Name || record.name || record.Nombre || record["Brand ID"] || record.id);

  // Sections to render (only non-empty ones)
  const sections: { key: string; icon: React.ReactNode; title: string; content: React.ReactNode }[] = [];

  if (fieldGroups) {
    // 1. IMÁGENES
    if (fieldGroups.images.length > 0) {
      sections.push({
        key: "images",
        icon: <ImageIcon className="w-4 h-4" />,
        title: "Imágenes",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldGroups.images.map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                <AttachmentGrid attachments={value as AirtableAttachment[]} />
              </div>
            ))}
          </div>
        ),
      });
    }

    // 2. ARCHIVOS ADJUNTOS (no imagen)
    if (fieldGroups.attachments.length > 0) {
      sections.push({
        key: "attachments",
        icon: <Paperclip className="w-4 h-4" />,
        title: "Archivos adjuntos",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldGroups.attachments.map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                <AttachmentGrid attachments={value as AirtableAttachment[]} />
              </div>
            ))}
          </div>
        ),
      });
    }

    // 3. INFORMACIÓN GENERAL (short text + status combined)
    const infoFields = [...fieldGroups.status, ...fieldGroups.info];
    if (infoFields.length > 0) {
      sections.push({
        key: "info",
        icon: <Info className="w-4 h-4" />,
        title: "Información general",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {infoFields.map(([key, originalValue]) => {
              const readOnly = isReadOnly(key, originalValue, table);
              const currentValue = key in editedFields ? editedFields[key] : originalValue;
              const ft = classifyField(key, originalValue);
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                    {readOnly && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Solo lectura</span>}
                  </div>
                  {ft === "status" ? (
                    <StatusBadge value={currentValue} readOnly={readOnly} onChange={(v) => handleFieldChange(key, v)} />
                  ) : (
                    <FieldEditor
                      fieldKey={key}
                      value={currentValue}
                      originalValue={originalValue}
                      readOnly={readOnly}
                      onChange={(v) => handleFieldChange(key, v)}
                      onCopy={() => handleCopy(key, currentValue)}
                      copied={copiedField === key}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 4. NÚMEROS Y MÉTRICAS
    if (fieldGroups.numbers.length > 0) {
      sections.push({
        key: "numbers",
        icon: <Hash className="w-4 h-4" />,
        title: "Números y métricas",
        content: (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {fieldGroups.numbers.map(([key, originalValue]) => {
              const readOnly = isReadOnly(key, originalValue, table);
              const currentValue = key in editedFields ? editedFields[key] : originalValue;
              return (
                <div key={key} className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">{key}</label>
                  {readOnly ? (
                    <p className="text-xl font-bold text-foreground tabular-nums">{currentValue != null ? Number(currentValue).toLocaleString() : "—"}</p>
                  ) : (
                    <input
                      type="number"
                      value={currentValue != null ? String(currentValue) : ""}
                      onChange={(e) => handleFieldChange(key, e.target.value === "" ? null : Number(e.target.value))}
                      className="w-full bg-transparent text-xl font-bold text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-1 -mx-1"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 5. URLs Y ENLACES
    if (fieldGroups.urls.length > 0) {
      sections.push({
        key: "urls",
        icon: <Globe className="w-4 h-4" />,
        title: "URLs y enlaces",
        content: (
          <div className="space-y-3">
            {fieldGroups.urls.map(([key, originalValue]) => {
              const readOnly = isReadOnly(key, originalValue, table);
              const currentValue = key in editedFields ? editedFields[key] : originalValue;
              const strVal = currentValue != null ? String(currentValue) : "";
              const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)/i.test(strVal) ||
                strVal.includes("airtableusercontent.com") ||
                strVal.includes("heygen") ||
                key.toLowerCase().includes("photo") ||
                key.toLowerCase().includes("imagen") ||
                key.toLowerCase().includes("miniatura") ||
                key.toLowerCase().includes("logo") ||
                key.toLowerCase().includes("avatar");
              return (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                  {/* Show image preview for image URLs */}
                  {isImageUrl && strVal && (
                    <div className="rounded-xl overflow-hidden border border-border bg-muted/30 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={strVal}
                        alt={key}
                        className="w-full object-contain bg-black/5"
                        style={{ maxHeight: "200px" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={strVal}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      readOnly={readOnly}
                      className={cn(
                        "flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm font-mono",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        readOnly && "opacity-60 cursor-not-allowed"
                      )}
                    />
                    {strVal && (
                      <a href={strVal} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 6. OPCIONES (Booleans)
    if (fieldGroups.booleans.length > 0) {
      sections.push({
        key: "booleans",
        icon: <ToggleLeft className="w-4 h-4" />,
        title: "Opciones",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldGroups.booleans.map(([key, originalValue]) => {
              const readOnly = isReadOnly(key, originalValue, table);
              const currentValue = key in editedFields ? editedFields[key] : originalValue;
              const isOn = !!currentValue;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                    isOn ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{key}</span>
                  <button
                    onClick={() => !readOnly && handleFieldChange(key, !currentValue)}
                    disabled={readOnly}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      isOn ? "bg-primary" : "bg-muted-foreground/30",
                      readOnly && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm", isOn ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 7. REGISTROS VINCULADOS (grouped by section)
    if (fieldGroups.linkedRecords.length > 0) {
      const groups = getLinkedFieldGroups(table);
      const fieldsMap = new Map(fieldGroups.linkedRecords);

      // Helper to render a single linked record field
      const renderLinkedField = (key: string, value: unknown) => {
        const linkedConfig = getLinkedFieldDef(table, key);
        const ids = (value as string[]).filter(
          (v) => typeof v === "string" && v.startsWith("rec")
        );

        if (linkedConfig) {
          return (
            <LinkedRecordSelector
              key={key}
              fieldName={key}
              recordIds={key in editedFields ? (editedFields[key] as string[]) : ids}
              config={linkedConfig}
              accountId={accountId}
              onChange={(newIds) => handleFieldChange(key, newIds)}
              onExpandRecord={!nested ? handleExpandLinkedRecord : undefined}
            />
          );
        }

        return (
          <LinkedRecordCard
            key={key}
            fieldName={key}
            values={value as unknown[]}
            lookupImageUrl={findLookupImage(key, record)}
            lookupName={findLookupName(key, record)}
          />
        );
      };

      if (groups && groups.length > 0) {
        // Track which fields are assigned to groups
        const assignedFields = new Set(groups.flatMap((g) => g.fields));

        sections.push({
          key: "linkedRecords",
          icon: <Link2 className="w-4 h-4" />,
          title: "Registros vinculados",
          content: (
            <div className="space-y-6">
              {groups.map((group) => {
                const groupFields = group.fields.filter((f) => fieldsMap.has(f));
                if (groupFields.length === 0) return null;
                return (
                  <div key={group.title}>
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {group.title}
                      </p>
                      <div className="flex-1 border-t border-dashed border-border/60" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {groupFields.map((fieldName) =>
                        renderLinkedField(fieldName, fieldsMap.get(fieldName))
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Ungrouped fields (if any) */}
              {fieldGroups.linkedRecords
                .filter(([key]) => !assignedFields.has(key))
                .length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Otros
                    </p>
                    <div className="flex-1 border-t border-dashed border-border/60" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fieldGroups.linkedRecords
                      .filter(([key]) => !assignedFields.has(key))
                      .map(([key, value]) => renderLinkedField(key, value))}
                  </div>
                </div>
              )}
            </div>
          ),
        });
      } else {
        // No groups defined: flat layout (fallback)
        sections.push({
          key: "linkedRecords",
          icon: <Link2 className="w-4 h-4" />,
          title: "Registros vinculados",
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldGroups.linkedRecords.map(([key, value]) =>
                renderLinkedField(key, value)
              )}
            </div>
          ),
        });
      }
    }

    // 8. ETIQUETAS
    if (fieldGroups.tags.length > 0) {
      sections.push({
        key: "tags",
        icon: <Tag className="w-4 h-4" />,
        title: "Etiquetas",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldGroups.tags.map(([key, value]) => {
              const items = value as unknown[];
              return (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((v, i) => {
                      const str = String(v);
                      const color = TAG_COLORS[hashString(str) % TAG_COLORS.length];
                      return (
                        <span key={i} className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border", color)}>
                          {str}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 9. TEXTOS LARGOS
    if (fieldGroups.longText.length > 0) {
      sections.push({
        key: "longText",
        icon: <FileText className="w-4 h-4" />,
        title: "Contenido",
        content: (
          <div className="space-y-4">
            {fieldGroups.longText.map(([key, originalValue]) => {
              const readOnly = isReadOnly(key, originalValue, table);
              const currentValue = key in editedFields ? editedFields[key] : originalValue;
              const strVal = currentValue != null ? String(currentValue) : "";
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</label>
                    <div className="flex items-center gap-1">
                      {readOnly && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Solo lectura</span>}
                      <button onClick={() => handleCopy(key, strVal)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Copiar">
                        {copiedField === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={strVal}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    readOnly={readOnly}
                    rows={Math.min(10, Math.max(3, Math.ceil(strVal.length / 80)))}
                    className={cn(
                      "w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-y leading-relaxed",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30",
                      readOnly && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // 10. LOGO DE ACCOUNT (pequeño, al final, con nombre del account)
    if (fieldGroups.accountLogo.length > 0) {
      // Find full account name from lookup fields — prefer "Name (from Account)" over "NameApp"
      const accountName = (() => {
        // First pass: look for "Name (from ...Account)" (full name, not slug)
        for (const [k, v] of Object.entries(record)) {
          const lower = k.toLowerCase();
          if (lower.includes("(from") && lower.includes("account") && lower.startsWith("name") && !lower.startsWith("nameapp")) {
            if (Array.isArray(v) && v.length > 0) return String(v[0]);
            if (typeof v === "string" && v.length > 0) return v;
          }
        }
        // Fallback: any account lookup with "name"
        for (const [k, v] of Object.entries(record)) {
          const lower = k.toLowerCase();
          if (lower.includes("(from") && lower.includes("account") && lower.includes("name")) {
            if (Array.isArray(v) && v.length > 0) return String(v[0]);
            if (typeof v === "string" && v.length > 0) return v;
          }
        }
        return null;
      })();

      sections.push({
        key: "accountLogo",
        icon: <ImageIcon className="w-4 h-4" />,
        title: "Cuenta",
        content: (
          <div className="flex items-center gap-3">
            {fieldGroups.accountLogo.map(([key, value]) => {
              const atts = value as AirtableAttachment[];
              const thumb = atts[0]?.thumbnails?.small?.url || atts[0]?.thumbnails?.large?.url || atts[0]?.url;
              return thumb ? (
                <div key={key} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt={accountName || "Account"} className="w-8 h-8 rounded-md object-contain border border-border/50 bg-muted/30" />
                  <span className="text-xs text-muted-foreground">{accountName || "Account"}</span>
                </div>
              ) : null;
            })}
          </div>
        ),
      });
    }
  }

  const zBackdrop = nested ? "z-[60]" : "z-50";
  const zModal = nested ? "z-[60]" : "z-50";
  const zWarningOverlay = nested ? "z-[70]" : "z-[60]";
  const zImageViewer = nested ? "z-[80]" : "z-[70]";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150", zBackdrop)}
        onClick={attemptClose}
      />

      {/* Centered modal */}
      <div className={cn("fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none", zModal)}>
        <div
          className="pointer-events-auto w-full max-w-4xl max-h-[92vh] bg-background rounded-2xl border border-border shadow-2xl shadow-black/30 flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground truncate">{recordName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{record.id}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {saveStatus === "success" && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-xs text-destructive animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" /> Error
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  hasChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
              <button onClick={attemptClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body — thematic sections */}
          <div className="flex-1 overflow-y-auto">
            {sections.map((section, idx) => (
              <div key={section.key} className={cn("px-6 py-5", idx < sections.length - 1 && "border-b border-border/50")}>
                <SectionHeader icon={section.icon} title={section.title} />
                <div className="mt-3">
                  {section.content}
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No hay campos visibles para este registro.
              </div>
            )}
          </div>

          {/* Footer with changes indicator */}
          {hasChanges && (
            <div className="px-6 py-3 border-t border-border bg-amber-500/5 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {Object.keys(editedFields).length} campo{Object.keys(editedFields).length > 1 ? "s" : ""} sin guardar
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditedFields({}); setSaveStatus("idle"); }}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes warning */}
      {showUnsavedWarning && (
        <>
          <div className={cn("fixed inset-0 bg-black/40", zWarningOverlay)} />
          <div className={cn("fixed inset-0 flex items-center justify-center p-4", zWarningOverlay)}>
            <div className="bg-background rounded-xl border border-border shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cambios sin guardar</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tienes {Object.keys(editedFields).length} campo{Object.keys(editedFields).length > 1 ? "s" : ""} modificado{Object.keys(editedFields).length > 1 ? "s" : ""}. Si cierras se perderán los cambios.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowUnsavedWarning(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  Seguir editando
                </button>
                <button
                  onClick={confirmClose}
                  className="px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all"
                >
                  Cerrar sin guardar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading spinner for expanded linked record */}
      {expandedLinked && loadingExpanded && (
        <>
          <div className={cn("fixed inset-0 bg-black/40", nested ? "z-[70]" : "z-[60]")} />
          <div className={cn("fixed inset-0 flex items-center justify-center", nested ? "z-[70]" : "z-[60]")}>
            <div className="bg-background rounded-xl border border-border shadow-2xl p-8 flex flex-col items-center gap-3 animate-in zoom-in-95 fade-in duration-150">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando registro...</p>
            </div>
          </div>
        </>
      )}

      {/* Nested drawer for expanded linked record */}
      {expandedLinked && expandedLinkedData && (
        <RecordEditDrawer
          record={expandedLinkedData}
          table={expandedLinked.table}
          accountId={accountId}
          onClose={closeExpandedLinked}
          nested
        />
      )}
    </>
  );
}

// ─── Section Header ──────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────
function StatusBadge({ value, readOnly, onChange }: { value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const strVal = value != null ? String(value) : "";
  const lower = strVal.toLowerCase();
  const colorClass =
    lower === "done" || lower === "activo" || lower === "active"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
      : lower.includes("progress") || lower.includes("campaña")
      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
      : "bg-sky-500/15 text-sky-400 border-sky-500/20";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-flex px-3 py-1 rounded-full text-xs font-bold border", colorClass)}>
        {strVal || "—"}
      </span>
      {!readOnly && (
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
    </div>
  );
}

// ─── Find lookup image for a linked record field ──────
function findLookupImage(fieldName: string, record: AppDataRecord): string | null {
  for (const [key, val] of Object.entries(record)) {
    if (!key.includes("(from ")) continue;
    const match = key.match(/\(from (.+)\)/);
    if (!match) continue;
    if (match[1].toLowerCase() !== fieldName.toLowerCase()) continue;
    if (isAttachmentArray(val)) {
      const arr = val as Record<string, unknown>[];
      const att = arr[0];
      const thumbs = att.thumbnails as Record<string, { url: string }> | undefined;
      return thumbs?.large?.url || thumbs?.small?.url || (att.url as string);
    }
  }
  return null;
}

// ─── Find lookup name for a linked record field ──────
function findLookupName(fieldName: string, record: AppDataRecord): string | null {
  for (const [key, val] of Object.entries(record)) {
    if (!key.includes("(from ")) continue;
    const match = key.match(/\(from (.+)\)/);
    if (!match) continue;
    if (match[1].toLowerCase() !== fieldName.toLowerCase()) continue;
    const lower = key.toLowerCase();
    if (lower.startsWith("name") || lower.startsWith("nombre")) {
      if (Array.isArray(val) && val.length > 0) return String(val[0]);
      if (typeof val === "string") return val;
    }
  }
  return null;
}

// ─── Linked Record Card ──────────────────────────────
function LinkedRecordCard({ fieldName, values, lookupImageUrl, lookupName }: {
  fieldName: string;
  values: unknown[];
  lookupImageUrl: string | null;
  lookupName: string | null;
}) {
  const isLinkedIds = values.length > 0 && typeof values[0] === "string" && String(values[0]).startsWith("rec");
  const displayName = lookupName || (isLinkedIds ? `${values.length} registro${values.length > 1 ? "s" : ""}` : null);

  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 p-3">
        {lookupImageUrl ? (
          <img
            src={lookupImageUrl}
            alt={fieldName}
            className="w-12 h-12 rounded-lg object-cover border border-border/50 flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{fieldName}</p>
          {displayName ? (
            <p className="text-sm font-medium text-foreground truncate mt-0.5">{displayName}</p>
          ) : (
            <div className="flex flex-wrap gap-1 mt-1">
              {values.slice(0, 4).map((v, i) => {
                const str = String(v);
                const isRecId = str.startsWith("rec");
                const color = isRecId ? "bg-muted/80 text-muted-foreground font-mono text-[10px] border-border" : TAG_COLORS[hashString(str) % TAG_COLORS.length];
                return (
                  <span key={i} className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[120px] border", color)}>
                    {str}
                  </span>
                );
              })}
              {values.length > 4 && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full border border-border">
                  +{values.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Field Editor (generic text input) ───────────────────
function FieldEditor({
  fieldKey,
  value,
  originalValue,
  readOnly,
  onChange,
  onCopy,
  copied,
}: {
  fieldKey: string;
  value: unknown;
  originalValue: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const strVal = value != null ? String(value) : "";

  // Long text
  if (strVal.length > 100) {
    return (
      <div className="relative">
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          rows={Math.min(8, Math.ceil(strVal.length / 70))}
          className={cn(
            "w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            readOnly && "opacity-60 cursor-not-allowed"
          )}
        />
        <button onClick={onCopy} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted transition-colors" title="Copiar">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    );
  }

  // Default: text input
  return (
    <input
      type="text"
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder="—"
      className={cn(
        "w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        readOnly && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

// ─── Attachment Grid (Images + Files) ────────────────────

interface AirtableAttachment {
  id?: string;
  url: string;
  filename?: string;
  type?: string;
  size?: number;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

function AttachmentGrid({ attachments }: { attachments: AirtableAttachment[] }) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <div className={cn(
        "grid gap-3",
        attachments.length === 1 ? "grid-cols-1" : attachments.length === 2 ? "grid-cols-2" : "grid-cols-3"
      )}>
        {attachments.map((att, i) => {
          if (!att || !att.url) return null;
          const isImage = isImageAttachment(att as unknown as Record<string, unknown>);
          const thumbUrl = att.thumbnails?.large?.url || att.thumbnails?.full?.url || att.url;
          const fullUrl = att.thumbnails?.full?.url || att.url;
          const hasFailed = failedUrls.has(thumbUrl);

          if (isImage) {
            return (
              <button
                key={att.id || i}
                type="button"
                onClick={() => !hasFailed && setSelectedImg(fullUrl)}
                className="relative group rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all bg-muted/30"
              >
                {hasFailed ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-muted-foreground/50">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs truncate max-w-full">{att.filename || "Image"}</span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumbUrl}
                    alt={att.filename || `Image ${i + 1}`}
                    className="w-full object-contain bg-black/5"
                    style={{ maxHeight: attachments.length === 1 ? "280px" : "180px" }}
                    onError={() => setFailedUrls((prev) => new Set(prev).add(thumbUrl))}
                  />
                )}
                {!hasFailed && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                )}
                {att.filename && !hasFailed && (
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white/90 truncate">{att.filename}</p>
                  </div>
                )}
              </button>
            );
          }

          // Non-image attachment (PDF, etc.)
          return (
            <a
              key={att.id || i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 bg-muted/30 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{att.filename || "Archivo"}</p>
                {att.size && <p className="text-[10px] text-muted-foreground">{formatFileSize(att.size)}</p>}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </a>
          );
        })}
      </div>

      {/* Full-screen image viewer */}
      {selectedImg && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-8" onClick={() => setSelectedImg(null)}>
          <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedImg} alt="Preview" className="max-w-full max-h-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
