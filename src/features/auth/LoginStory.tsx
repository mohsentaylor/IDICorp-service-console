import { Brand } from "@/components/layout/Brand";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** Decorative left half of the sign-in screen (hidden copy on phones). */
export function LoginStory() {
  return (
    <section className="relative flex flex-col justify-between overflow-hidden bg-story px-7 py-6 text-[#ebf1df] md:px-10 md:py-10 xl:px-16 xl:py-12">
      <Brand tone="light" />
      <div className="max-md:hidden">
        <Eyebrow className="text-[#b7c9a6]">YOUR OPERATIONS, CONNECTED</Eyebrow>
        <h1 className="my-6 text-[42px] font-medium tracking-[-2px] xl:text-[52px]">
          A clearer view.
          <br />A better workflow.
        </h1>
        <p className="leading-[1.8] text-[#b4c6b8]">
          One workspace for everyday tasks,
          <br />
          real-time tools, and service exploration.
        </p>
        <div aria-hidden="true" className="my-[30px] text-[120px] leading-none text-[#a8bf78]">
          ◌<span className="block text-[10px] leading-loose tracking-[3px]">tasks · calculate · connect</span>
        </div>
      </div>
      <small className="text-[9px] tracking-[2px] text-[#a0bba7] max-md:hidden">INDUSTRIAL INTELLIGENCE / INTERNAL TOOLS</small>
    </section>
  );
}
