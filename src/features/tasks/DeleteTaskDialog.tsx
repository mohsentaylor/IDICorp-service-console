"use client";
/** Confirmation before deleting; "Keep task" has initial focus (safe default). */
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Task } from "@/types";

export function DeleteTaskDialog({
  task,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  task: Task;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog labelledBy="delete-task-title" busy={busy} onClose={onClose}>
      <h2 id="delete-task-title">Delete this task?</h2>
      <Alert text={error} />
      <p className="mt-3.5 wrap-anywhere">“{task.title}” will be permanently removed from this session.</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button onClick={onClose} disabled={busy} data-autofocus>
          Keep task
        </Button>
        <Button variant="danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Deleting…" : "Delete task"}
        </Button>
      </div>
    </Dialog>
  );
}
