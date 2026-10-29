import type { ButtonHTMLAttributes } from "react";

/** Visual variants used across the console. */
export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "dangerText";

const variants: Record<ButtonVariant, string> = {
  primary: "border-forest bg-forest text-white hover:bg-forest-dark px-4 py-2.5",
  secondary: "border-[#dce4df] bg-white text-[#284d43] hover:bg-[#edf3ee] px-4 py-2.5",
  quiet: "border-transparent bg-transparent text-[#284d43] hover:bg-[#edf3ee] px-2.5 py-[7px] text-xs",
  danger: "border-danger bg-danger text-white hover:bg-[#8c352a] px-4 py-2.5",
  dangerText: "border-transparent bg-transparent text-[#a64436] hover:bg-[#fbeeea] px-2.5 py-[7px] text-xs",
};

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={`rounded-lg border font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
