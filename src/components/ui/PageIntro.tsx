import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/** Heading block at the top of every workspace screen. */
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[30px] flex items-center justify-between gap-5 max-md:flex-col max-md:items-stretch max-md:gap-[18px]">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>
          {title}
          <span className="text-leaf">.</span>
        </h1>
        <p className="text-[13px] text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
