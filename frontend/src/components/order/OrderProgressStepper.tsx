import { Check } from 'lucide-react';

interface OrderProgressStepperProps {
  currentStep: number; // 1-4
}

const STEPS = [
  { num: 1, label: 'Sélection' },
  { num: 2, label: 'Configuration' },
  { num: 3, label: 'Confirmation' },
  { num: 4, label: '✓' },
];

export default function OrderProgressStepper({ currentStep }: OrderProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const isCompleted = step.num < currentStep;
        const isCurrent = step.num === currentStep;

        return (
          <div key={step.num} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-[#00D4AA] text-white'
                    : isCurrent
                      ? 'bg-[#00D4AA] text-white ring-4 ring-[#00D4AA]/20'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.num === 4 ? '✓' : step.num}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-[#00D4AA] font-bold'
                    : isCompleted
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 mt-[-16px] ${
                  step.num < currentStep
                    ? 'bg-[#00D4AA]'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
