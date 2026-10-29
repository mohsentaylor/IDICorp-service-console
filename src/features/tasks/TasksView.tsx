"use client";
/**
 * Task workspace screen: composes the toolbar, list and dialogs.
 * All data logic lives in the useTasks hook; this file only renders.
 */
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { useTasks } from "@/hooks/useTasks";
import { useToken } from "@/providers/SessionProvider";
import { taskService } from "@/services/taskService";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskEditorDialog } from "./TaskEditorDialog";
import { TaskItem } from "./TaskItem";
import { TaskToolbar } from "./TaskToolbar";
import type { Task } from "@/types";

export function TasksView() {
  const token = useToken();
  const t = useTasks(token);
  /** undefined = closed, null = creating, Task = editing. */
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const dialogOpen = editing !== undefined || deleting !== null;
  const filtered = Boolean(t.search) || t.filter !== "all";

  const { setPaused } = t;
  useEffect(() => setPaused(dialogOpen), [dialogOpen, setPaused]);

  const openEditor = (task: Task | null) => {
    t.clearMutationError();
    setEditing(task);
  };
  const closeDialogs = () => {
    setEditing(undefined);
    setDeleting(null);
    t.clearMutationError();
  };

  return (
    <>
      <PageIntro
        eyebrow="ORGANIZE YOUR DAY"
        title="Task workspace"
        description="A little structure. A lot of progress."
        action={
          <Button variant="primary" onClick={() => openEditor(null)}>
            ＋ Create task
          </Button>
        }
      />
      <div className="mb-7 flex gap-2.5 rounded-[9px] border border-[#dfe5d4] bg-[#f0f3e8] p-3.5 md:gap-4 md:px-[21px] md:py-[18px]">
        <span aria-hidden="true" className="text-2xl text-[#869957]">◷</span>
        <div>
          <strong className="text-xs font-semibold">A workspace for this session</strong>
          <p className="mt-[3px] text-[11px] text-[#677354]">
            Tasks expire 1 hour after creation or their latest update. A new sign-in starts a separate collection.
          </p>
        </div>
      </div>

      <Panel>
        <div className="mb-[22px] flex items-center justify-between gap-3 px-[18px] pt-5 md:px-[26px] md:pt-6">
          <h2>
            Your tasks{" "}
            <span className="ml-[7px] rounded-[5px] border border-[#e4eadf] bg-[#f1f4ee] px-[7px] py-0.5 align-middle text-[10px] text-[#7c8b76]">
              {t.loading ? "…" : t.tasks.length}
            </span>
          </h2>
          <Button variant="quiet" onClick={t.refresh} disabled={t.loading}>
            ↻ Refresh
          </Button>
        </div>
        <TaskToolbar search={t.search} onSearch={t.setSearch} filter={t.filter} onFilter={t.setFilter} />
        <Alert className="mx-[26px]! my-4!" text={t.listError || (dialogOpen ? "" : t.mutationError)} />
        <p className="sr-only" role="status">
          {t.feedback}
        </p>

        <div aria-busy={t.loading}>
          {t.loading ? (
            <EmptyState>Loading your tasks…</EmptyState>
          ) : t.listError ? (
            <EmptyState>
              Could not load tasks.{" "}
              <Button className="ml-2" onClick={t.refresh}>
                Try again
              </Button>
            </EmptyState>
          ) : t.tasks.length === 0 ? (
            <EmptyState>
              <span aria-hidden="true" className="mb-2.5 block text-[32px]">▤</span>
              <h3 className="m-2">{filtered ? "No matching tasks" : "A fresh start"}</h3>
              <p className="m-1.5">{filtered ? "Try a different search or filter." : "Create a task to get things moving."}</p>
            </EmptyState>
          ) : (
            t.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                busy={t.busy}
                onToggle={() =>
                  void t.mutate(
                    (signal) => taskService.update(token, task.id, { completed: !task.completed }, signal),
                    "Task status updated.",
                  )
                }
                onEdit={() => openEditor(task)}
                onDelete={() => {
                  t.clearMutationError();
                  setDeleting(task);
                }}
              />
            ))
          )}
        </div>

        <div className="flex justify-between bg-[#fcfdfb] px-[18px] py-3.5 text-[10px] text-subtle md:px-[26px] md:py-4">
          {t.loading ? "Syncing with service…" : `${t.tasks.length} task${t.tasks.length === 1 ? "" : "s"} in this view`}
          <span className="text-[8px] tracking-[1.3px] max-md:hidden">SESSION-SCOPED STORAGE</span>
        </div>
      </Panel>

      {editing !== undefined && (
        <TaskEditorDialog
          task={editing}
          busy={t.busy}
          error={t.mutationError}
          onClose={closeDialogs}
          onSave={async (input) => {
            const saved = await t.mutate(
              (signal) =>
                editing ? taskService.replace(token, editing.id, input, signal) : taskService.create(token, input, signal),
              "Task saved.",
            );
            if (saved) setEditing(undefined);
          }}
        />
      )}
      {deleting && (
        <DeleteTaskDialog
          task={deleting}
          busy={t.busy}
          error={t.mutationError}
          onClose={closeDialogs}
          onConfirm={async () => {
            const removed = await t.mutate((signal) => taskService.remove(token, deleting.id, signal), "Task deleted.");
            if (removed) setDeleting(null);
          }}
        />
      )}
    </>
  );
}
