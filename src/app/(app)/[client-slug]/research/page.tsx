"use client";

import { useState } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useResearchList, useResearchDetail } from "@/lib/hooks/use-research";
import { ResearchList } from "@/components/research/research-list";
import { ResearchDetailPanel } from "@/components/research/research-detail";
import { Bot, Search } from "lucide-react";

export default function ResearchPage() {
  const { currentAccount } = useAccountStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: researchList = [], isLoading: listLoading } = useResearchList({
    accountId: currentAccount?.id,
  });

  const { data: researchDetail, isLoading: detailLoading } = useResearchDetail(selectedId);

  // Auto-select first item when list loads
  if (researchList.length > 0 && !selectedId && !listLoading) {
    setSelectedId(researchList[0].id);
  }

  // Filter by search
  const filteredList = searchQuery
    ? researchList.filter((r) =>
        r.titulo?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : researchList;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Research List */}
      <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Research</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <ResearchList
            items={filteredList}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={listLoading}
          />
        </div>
      </div>

      {/* Right Panel - Research Detail */}
      <div className="flex-1 overflow-hidden bg-background">
        <ResearchDetailPanel
          research={researchDetail}
          isLoading={detailLoading}
        />
      </div>
    </div>
  );
}
