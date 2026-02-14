"use client";

import { useState, useEffect, useCallback } from "react";
import type { DraftPublicacion } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTriggerThumbnail } from "@/lib/hooks/use-trigger-thumbnail";
import { useUpdateDraft } from "@/lib/hooks/use-update-draft";
import { useExpressions } from "@/lib/hooks/use-expressions";
import { getEngineColor } from "@/lib/constants/engine-colors";
import { cn } from "@/lib/utils";
import {
  X,
  Heart,
  Award,
  Loader2,
  Check,
  AlertCircle,
  ImageIcon,
  Info,
  Sparkles,
  User,
  Calendar,
  Save,
} from "lucide-react";

const ABC_OPTIONS = ["A", "B", "C"];
const VARIACIONES_OPTIONS = ["1", "2", "3", "4"];
const PONE_PERSONA_OPTIONS = ["Si", "No"];

interface ThumbnailDetailProps {
  draft: DraftPublicacion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVariationsTriggered?: () => void;
}

export function ThumbnailDetail({ draft, open, onOpenChange, onVariationsTriggered }: ThumbnailDetailProps) {
  const { mutate: triggerVariations, isPending: isTriggering, isSuccess: triggerSuccess, isError: triggerError, error: triggerErrorMsg, reset: resetTrigger } = useTriggerThumbnail();
  const { mutate: updateDraft, isPending: isUpdating } = useUpdateDraft();
  const { data: allExpressions = [] } = useExpressions();

  // Local editable state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [favorita, setFavorita] = useState(false);
  const [portada, setPortada] = useState(false);
  const [archivar, setArchivar] = useState(false);
  const [portadaAbc, setPortadaAbc] = useState<string | null>(null);
  const [ponePersona, setPonePersona] = useState<string | null>(null);
  const [numVariaciones, setNumVariaciones] = useState<string | null>(null);
  const [selectedExpresionIds, setSelectedExpresionIds] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync draft data to local state
  useEffect(() => {
    if (draft) {
      setTitulo(draft.titulo || "");
      setDescripcion(draft.descripcion || "");
      setFeedback(draft.feedback || "");
      setFavorita(draft.favorita);
      setPortada(draft.portada);
      setArchivar(draft.archivar);
      setPortadaAbc(draft.portada_youtube_abc);
      setPonePersona(draft.pone_persona);
      setNumVariaciones(draft.numero_variaciones);
      setSelectedExpresionIds(draft.expresion_ids || []);
      setHasChanges(false);
    }
  }, [draft]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleSave = () => {
    if (!draft) return;
    updateDraft({
      id: draft.id,
      titulo,
      descripcion,
      feedback,
      favorita,
      portada,
      archivar,
      portada_youtube_abc: portadaAbc,
      pone_persona: ponePersona,
      numero_variaciones: numVariaciones,
    });
    setHasChanges(false);
  };

  const handleToggle = (field: string, value: boolean, setter: (v: boolean) => void) => {
    if (!draft) return;
    setter(value);
    updateDraft({ id: draft.id, [field]: value });
  };

  const handleSelectChange = (field: string, value: string | null, setter: (v: string | null) => void) => {
    if (!draft) return;
    setter(value);
    updateDraft({ id: draft.id, [field]: value });
  };

  const handleToggleExpresion = (expresionId: string) => {
    if (!draft) return;
    const newIds = selectedExpresionIds.includes(expresionId)
      ? selectedExpresionIds.filter((id) => id !== expresionId)
      : [...selectedExpresionIds, expresionId];
    setSelectedExpresionIds(newIds);
    updateDraft({ id: draft.id, expresion_ids: newIds });
  };

  const handleCreateVariations = () => {
    if (!draft) return;
    triggerVariations({ recordId: draft.id });
    onVariationsTriggered?.();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetTrigger();
    }
    onOpenChange(isOpen);
  };

  if (!draft) return null;

  const imageUrl = draft.miniatura_url || draft.url_miniatura;
  const engineColor = draft.slideengine ? getEngineColor(draft.slideengine) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {draft.numero_concepto && (
              <span className="text-sm font-bold font-mono text-white bg-black/70 px-3 py-1 rounded-lg">
                {draft.numero_concepto}
              </span>
            )}
            <span className="text-lg">{draft.titulo || draft.name || "Miniatura"}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            {draft.status && (
              <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {draft.status}
              </span>
            )}
            {draft.created && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(draft.created).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Miniatura grande */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={draft.titulo || "Miniatura"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                <span className="text-sm text-muted-foreground">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Toggle actions row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Archivar */}
            <button
              onClick={() => handleToggle("archivar", !archivar, setArchivar)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                archivar
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-muted/50 border-border/50 text-muted-foreground hover:border-red-500/30 hover:text-red-400"
              )}
            >
              <X className="w-3.5 h-3.5" />
              {archivar ? "Archivada" : "Archivar"}
            </button>

            {/* Favorita */}
            <button
              onClick={() => handleToggle("favorita", !favorita, setFavorita)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                favorita
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-muted/50 border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", favorita && "fill-emerald-400")} />
              Favorita
              {favorita && <Check className="w-3 h-3" />}
            </button>

            {/* Portada */}
            <button
              onClick={() => handleToggle("portada", !portada, setPortada)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                portada
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-muted/50 border-border/50 text-muted-foreground hover:border-amber-500/30 hover:text-amber-400"
              )}
            >
              <Award className={cn("w-3.5 h-3.5", portada && "fill-amber-400")} />
              Portada
              {portada && <Check className="w-3 h-3" />}
            </button>

            {/* Portada Youtube ABC selector */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[10px] text-muted-foreground mr-1">ABC:</span>
              {ABC_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectChange("portada_youtube_abc", portadaAbc === opt ? null : opt, setPortadaAbc)}
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-bold transition-all",
                    portadaAbc === opt
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Titulo editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titulo</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); markChanged(); }}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="Titulo de la miniatura..."
            />
          </div>

          {/* Descripcion editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); markChanged(); }}
              rows={3}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              placeholder="Descripcion de la miniatura..."
            />
          </div>

          {/* Feedback editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); markChanged(); }}
              rows={2}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              placeholder="Escribe feedback para mejorar la miniatura..."
            />
          </div>

          {/* Save button for text fields */}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          )}

          {/* Info tooltip */}
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Tips para miniaturas
            </button>
            {showInfo && (
              <div className="mt-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 space-y-1.5">
                <p>Pocas cosas en la miniatura, sencillez, cinematografico, muy poco texto.</p>
                <p>Para personajes conocidos: que aparezca el <strong>nombre de la persona</strong> en la miniatura.</p>
              </div>
            )}
          </div>

          {/* SlideEngine + Metadata grid */}
          <div className="glass-card rounded-lg p-4 space-y-4">
            {/* SlideEngine - grande y con colores */}
            {draft.slideengine && engineColor && (
              <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold", engineColor.text, engineColor.bg, engineColor.border)}>
                <Sparkles className="w-4 h-4" />
                {draft.slideengine}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Persona - resolved names */}
              {draft.persona_names.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Persona</span>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-medium text-foreground">{draft.persona_names.join(", ")}</span>
                  </div>
                </div>
              )}

              {/* Pone Persona selector */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">Pone Persona</span>
                <div className="flex items-center gap-1.5">
                  {PONE_PERSONA_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectChange("pone_persona", opt, setPonePersona)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                        ponePersona === opt
                          ? opt === "Si"
                            ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400"
                            : "bg-blue-400/10 border-blue-400/30 text-blue-400"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expresion selector */}
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground block mb-1.5">Expresion</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {allExpressions.map((expr) => {
                    const isSelected = selectedExpresionIds.includes(expr.id);
                    return (
                      <button
                        key={expr.id}
                        onClick={() => handleToggleExpresion(expr.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                            : "bg-muted/30 border-border/50 text-muted-foreground hover:border-amber-400/30"
                        )}
                      >
                        {expr.image && (
                          <img src={expr.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        {expr.name}
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                  {allExpressions.length === 0 && selectedExpresionIds.length > 0 && (
                    <span className="text-xs text-muted-foreground">{selectedExpresionIds.length} seleccionada(s)</span>
                  )}
                </div>
              </div>

              {/* Numero Variaciones selector */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">Variaciones</span>
                <div className="flex items-center gap-1">
                  {VARIACIONES_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectChange("numero_variaciones", opt, setNumVariaciones)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all border",
                        numVariaciones === opt
                          ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo Creatividad */}
              {draft.tipo_creatividad && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Tipo Creatividad</span>
                  <span className="text-sm font-medium text-foreground">{draft.tipo_creatividad}</span>
                </div>
              )}

              {/* Formato */}
              {draft.formato && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Formato</span>
                  <span className="text-sm font-medium text-foreground">{draft.formato}</span>
                </div>
              )}
            </div>
          </div>

          {/* Crea Nuevas Variaciones - BOTON PRINCIPAL */}
          <div className="space-y-2">
            <button
              onClick={handleCreateVariations}
              disabled={isTriggering}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all",
                isTriggering
                  ? "bg-primary/10 border-2 border-primary/40 text-primary"
                  : triggerSuccess
                    ? "bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400"
                    : "bg-gradient-to-r from-primary/20 to-violet-500/20 border-2 border-primary/30 text-primary hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              )}
            >
              {isTriggering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando variaciones...
                </>
              ) : triggerSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Enviado a n8n — se actualizara automaticamente
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Crea Nuevas Variaciones
                </>
              )}
            </button>

            {triggerError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {triggerErrorMsg?.message || "Error al crear variaciones"}
              </div>
            )}
          </div>

          {/* Prompt (read-only) */}
          {draft.prompt_miniatura && (
            <div className="glass-card rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Prompt
              </h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {draft.prompt_miniatura}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
