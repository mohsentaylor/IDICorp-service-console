/** Error message announced to screen readers; renders nothing when empty. */
export function Alert({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div
      role="alert"
      className={`my-3 rounded-lg border border-alert-line bg-alert-bg p-[13px] text-alert-ink wrap-anywhere ${className}`}
    >
      {text}
    </div>
  );
}
