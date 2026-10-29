"use client";
/** One row of the task list with completion toggle, edit and delete. */
import { Button } from "@/components/ui/Button";
import { estimateExpiry } from "@/lib/tasks/taskQuery";
import type { Task } from "@/types";

export function TaskItem({
  task,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-wrap items-start gap-3 border-b border-line-soft px-[18px] py-5 md:flex-nowrap md:gap-[15px] md:px-[26px] md:py-[25px]">
      <input
        type="checkbox"
        className="my-[5px]"
        aria-label={`Mark ${task.title} ${task.completed ? "active" : "completed"}`}
        checked={task.completed}
        disabled={busy}
        onChange={onToggle}
      />
      <div className="min-w-0 flex-1 max-md:basis-[calc(100%-36px)]">
        <div className="mb-[7px] flex flex-wrap items-center gap-1.5 md:gap-3">
          <h3 className={`font-semibold wrap-anywhere ${task.completed ? "text-[#87937e] line-through" : ""}`}>
            {task.title}
          </h3>
          <span
            className={`inline-block rounded-[5px] px-[7px] py-[3px] text-[9px] whitespace-nowrap ${
              task.completed ? "bg-[#eef4e9] text-[#50793b]" : "bg-[#faf5e5] text-[#7e6a2b]"
            }`}
          >
            {task.completed ? "Completed" : "In progress"}
          </span>
        </div>
        <p className="mb-3 text-xs whitespace-pre-wrap text-[#687660] wrap-anywhere">
          {task.description || "No description added."}
        </p>
        <small className="text-[9px] text-[#6c7964]">
          #{task.id} · Updated {new Date(task.updated_at).toLocaleString()} · Expires{" "}
          {estimateExpiry(task.updated_at).toLocaleTimeString()}
        </small>
      </div>
      <div className="flex max-md:pl-[30px] md:flex-col">
        <Button variant="quiet" className="min-h-9 text-[10px]" onClick={onEdit} disabled={busy} aria-label={`Edit ${task.title}`}>
          Edit
        </Button>
        <Button
          variant="dangerText"
          className="min-h-9 text-[10px]"
          onClick={onDelete}
          disabled={busy}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
