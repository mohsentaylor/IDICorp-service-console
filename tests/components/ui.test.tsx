import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TaskItem } from "@/features/tasks/TaskItem";
import { TaskToolbar } from "@/features/tasks/TaskToolbar";
import type { Task } from "@/types";

const task: Task = {
  id: 7,
  title: "Buy milk",
  description: "",
  completed: false,
  created_at: "2026-10-28T10:00:00Z",
  updated_at: "2026-10-28T10:00:00Z",
};

describe("Alert", () => {
  it("renders nothing without text and an alert role with text", () => {
    const { container, rerender } = render(<Alert text="" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Alert text="Oops" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Oops");
  });
});

describe("Button", () => {
  it("defaults to type=button so it never submits forms by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "button");
  });
});

describe("TaskItem", () => {
  it("shows the task and wires its actions with accessible names", () => {
    const handlers = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
    render(<TaskItem task={task} busy={false} {...handlers} />);
    expect(screen.getByText("No description added.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Mark Buy milk completed" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Buy milk" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Buy milk" }));
    expect(handlers.onToggle).toHaveBeenCalledOnce();
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });

  it("disables actions while a mutation is running", () => {
    render(<TaskItem task={task} busy onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit Buy milk" })).toBeDisabled();
  });
});

describe("TaskToolbar", () => {
  it("reports search text and marks the active filter as pressed", () => {
    const onSearch = vi.fn();
    const onFilter = vi.fn();
    render(<TaskToolbar search="" onSearch={onSearch} filter="active" onFilter={onFilter} />);
    fireEvent.change(screen.getByLabelText("Search tasks"), { target: { value: "milk" } });
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(onSearch).toHaveBeenCalledWith("milk");
    expect(onFilter).toHaveBeenCalledWith("completed");
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
  });
});
