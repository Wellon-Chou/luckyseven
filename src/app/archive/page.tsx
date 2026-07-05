'use client';

import { useState } from "react";
import { Section } from "../../components/Section";
import { PageGate } from "../../components/PageGate";
import { useAuth } from "../../components/AuthProvider";
import { FolderList, type FolderSelection } from "../../components/archive/FolderList";
import { BlueprintRecordList } from "../../components/archive/BlueprintRecordList";

export default function ArchivePage() {
  const { user, openModal } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<FolderSelection>("all");

  return (
    <PageGate minLevel={1}>
      <div id="sec-archive" className="w-full scroll-mt-24">
        <Section title="蓝图存档">
          {!user ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-amber-700/80">请先登录以查看和管理存档。</p>
              <button
                type="button"
                onClick={() => openModal()}
                className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                登录
              </button>
            </div>
          ) : (
            <div className="archive-page mt-2 flex flex-col gap-6 lg:flex-row lg:gap-8">
              <aside className="w-full shrink-0 rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 lg:w-52">
                <FolderList selected={selectedFolder} onSelect={setSelectedFolder} />
              </aside>
              <div className="min-w-0 flex-1">
                <BlueprintRecordList selectedFolder={selectedFolder} />
              </div>
            </div>
          )}
        </Section>
      </div>
    </PageGate>
  );
}
