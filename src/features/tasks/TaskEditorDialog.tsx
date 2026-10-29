"use client";
/** Create / edit form inside a modal. The draft survives a failed save. */
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FineText } from "@/components/ui/FineText";
import type { Task, TaskInput } from "@/types";

export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 2000;

export function TaskEditorDialog({
  task,
  busy,
  error,
  onSave,
  onClose,
}: {
  /** null = create a new task. */
  task: Task | null;
  busy: boolean;
  error: string;
  onSave: (input: TaskInput) => void;
  onClose: () => void;
}) {
  return (
    <Dialog labelledBy="task-editor-title" busy={busy} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSave({
            title: String(form.get("title")).trim(),
            description: String(form.get("description") ?? ""),
            completed: form.get("completed") === "on",
          });
        }}
      >
        <div className="mb-[25px] flex items-center justify-between gap-3">
          <h2 id="task-editor-title">{task ? "Edit task" : "Create a task"}</h2>
          <Button variant="quiet" aria-label="Close editor" onClick={onClose} disabled={busy}>
            ✕
          </Button>
        </div>
        <Alert text={error} />
        <label>
          Title
          <input name="title" required pattern=".*\S.*" maxLength={MAX_TITLE} defaultValue={task?.title} data-autofocus />
        </label>
        <label>
          Description
          <textarea name="description" rows={5} maxLength={MAX_DESCRIPTION} defaultValue={task?.description} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="completed" defaultChecked={task?.completed} />
          Completed
        </label>
        <FineText>Up to 120 characters for the title and 2,000 for the description.</FineText>
        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
