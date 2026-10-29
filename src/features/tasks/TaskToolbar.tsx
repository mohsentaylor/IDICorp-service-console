"use client";
/** Search box and completion filter tabs. */
import type { TaskFilter } from "@/types";

const FILTERS: TaskFilter[] = ["all", "active", "completed"];

export function TaskToolbar({
  search,
  onSearch,
  filter,
  onFilter,
}: {
  search: string;
  onSearch: (value: string) => void;
  filter: TaskFilter;
  onFilter: (value: TaskFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-[18px] pb-[18px] md:gap-5 md:px-[26px] md:pb-[22px]">
      <label className="m-0 min-w-[200px] flex-1 md:max-w-[400px]">
        <span className="sr-only">Search tasks</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search titles and descriptions…"
          className="m-0! bg-[#fafbf8]! text-[11px]"
        />
      </label>
      <div role="group" aria-label="Completion filter" className="flex rounded-[7px] border border-[#e9ede3] bg-[#f5f7f2] p-1 max-md:w-full">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => onFilter(value)}
            className={`rounded-md px-[11px] py-[7px] text-[10px] font-medium max-md:flex-1 ${
              filter === value ? "bg-white text-[#3b583b] shadow-[0_1px_4px_#203b3610]" : "text-[#8a9484]"
            }`}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
