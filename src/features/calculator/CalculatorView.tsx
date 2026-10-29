"use client";
/** Calculator screen. Results are always computed by the backend. */
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FineText } from "@/components/ui/FineText";
import { ToolLayout } from "@/components/ui/Panel";
import { useCalculator } from "@/hooks/useCalculator";
import { OPERATIONS } from "@/lib/calculator/parseNumbers";
import { useToken } from "@/providers/SessionProvider";
import type { CalculatorOperation } from "@/types";

export function CalculatorView() {
  const calc = useCalculator(useToken());
  return (
    <ToolLayout title="Calculator" eyebrow="NUMBERS, IN REAL TIME" description="Run an operation over a sequence of numbers.">
      <ConnectionStatus channel="calculator" state={calc.connection} onReconnect={calc.reconnect} />
      <form onSubmit={calc.calculate}>
        <label>
          Operation
          <select
            disabled={calc.pending}
            value={calc.operation}
            onChange={(e) => calc.setOperation(e.target.value as CalculatorOperation)}
          >
            {OPERATIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Numbers
          <textarea rows={3} disabled={calc.pending} value={calc.numbers} onChange={(e) => calc.setNumbers(e.target.value)} required />
        </label>
        <FineText>Separate numbers with commas or spaces. Subtraction and division run from left to right.</FineText>
        <Alert text={calc.error} />
        <Button type="submit" variant="primary" disabled={calc.pending || calc.connection !== "Connected"}>
          {calc.pending ? "Calculating…" : "Calculate →"}
        </Button>
      </form>
      <div className="mt-7 rounded-[9px] bg-soft p-6" aria-live="polite">
        <Eyebrow>RESULT</Eyebrow>
        <strong className="block text-[40px] font-medium wrap-anywhere">{calc.result ?? "—"}</strong>
      </div>
    </ToolLayout>
  );
}
