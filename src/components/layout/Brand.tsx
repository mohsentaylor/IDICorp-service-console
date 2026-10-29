/** IDICorp logotype. `tone="light"` is used on the dark sign-in panel. */
export function Brand({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span
      className={`flex items-center gap-3 text-[31px] font-extrabold tracking-[-1px] max-md:text-[25px] ${
        tone === "light" ? "text-[#edf1e0]" : "text-forest"
      }`}
    >
      i
      <span className="text-[22px] leading-[1.1] tracking-[-0.5px] max-md:text-lg">
        IDICorp
        <small className="mt-1.5 block text-[8px] font-semibold tracking-[1.9px] max-md:text-[7px]">
          SERVICE CONSOLE
        </small>
      </span>
    </span>
  );
}
