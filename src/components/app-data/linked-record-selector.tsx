"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Search,
  Check,
  Loader2,
  Link2,
  X,
} from "lucide-react";
import type { LinkedFieldDef } from "@/lib/constants/linked-fields";

interface ResolvedRecord {
  id: string;
  name: string;
}

interface LinkedRecordSelectorProps {
  fieldName: string;
  recordIds: string[];
  config: LinkedFieldDef;
  accountId: string | undefined;
  onChange: (newIds: string[]) => void;
}

export function LinkedRecordSelector({
  fieldName,
  recordIds,
  config,
  accountId,
  onChange,
}: LinkedRecordSelectorProps) {
  const [resolvedNames, setResolvedNames] = useState<
    Record<string, string>
  >({});
  const [loadingNames, setLoadingNames] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ResolvedRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Resolve current linked record names
  useEffect(() => {
    if (recordIds.length === 0) return;
    const idsToResolve = recordIds.filter((id) => !resolvedNames[id]);
    if (idsToResolve.length === 0) return;

    setLoadingNames(true);
    fetch(
      `/api/data/resolve-links?table=${config.table}&ids=${idsToResolve.join(",")}`
    )
      .then((r) => r.json())
      .then((data: ResolvedRecord[]) => {
        if (Array.isArray(data)) {
          setResolvedNames((prev) => {
            const next = { ...prev };
            for (const item of data) {
              next[item.id] = item.name;
            }
            return next;
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingNames(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordIds.join(","), config.table]);

  // Fetch available options when dropdown opens
  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const params = new URLSearchParams({ table: config.table });
      if (accountId) params.set("accountId", accountId);
      if (config.filter) params.set("filter", config.filter);

      const res = await fetch(`/api/data/resolve-links?${params}`);
      const data: ResolvedRecord[] = await res.json();
      if (Array.isArray(data)) {
        setOptions(data);
        // Also update resolved names cache
        setResolvedNames((prev) => {
          const next = { ...prev };
          for (const item of data) {
            next[item.id] = item.name;
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to fetch linked record options:", err);
    } finally {
      setLoadingOptions(false);
    }
  }, [config.table, config.filter, accountId]);

  // Open dropdown
  const openDropdown = () => {
    setIsOpen(true);
    setSearchTerm("");
    fetchOptions();
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Select a record
  const handleSelect = (id: string) => {
    if (config.multiple) {
      if (recordIds.includes(id)) {
        onChange(recordIds.filter((r) => r !== id));
      } else {
        onChange([...recordIds, id]);
      }
    } else {
      onChange([id]);
      setIsOpen(false);
    }
  };

  // Remove a record (for multi-select)
  const handleRemove = (id: string) => {
    onChange(recordIds.filter((r) => r !== id));
  };

  // Filter options by search
  const filteredOptions = searchTerm
    ? options.filter((o) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const currentName =
    recordIds.length > 0 && resolvedNames[recordIds[0]]
      ? resolvedNames[recordIds[0]]
      : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current value display */}
      <div
        className={cn(
          "rounded-xl border bg-muted/20 overflow-hidden transition-colors cursor-pointer",
          isOpen
            ? "border-primary/50 ring-2 ring-primary/20"
            : "border-border hover:border-primary/30"
        )}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
              {fieldName}
            </p>
            {loadingNames ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Cargando...
                </span>
              </div>
            ) : recordIds.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 mt-0.5">
                Sin asignar
              </p>
            ) : config.multiple ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {recordIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                  >
                    {resolvedNames[id] || id.slice(0, 8) + "..."}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(id);
                      }}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                {currentName || recordIds[0]?.slice(0, 12) + "..."}
              </p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {loadingOptions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando opciones...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? "No se encontraron resultados"
                  : "No hay registros disponibles"}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = recordIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-border"
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {option.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Clear option */}
          {recordIds.length > 0 && (
            <div className="p-1 border-t border-border">
              <button
                onClick={() => {
                  onChange([]);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Quitar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
