import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface HackathonDemoGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string | 'live') => void;
  onAskQuestion: (question: string) => void;
  onToggleTheme: () => void;
}

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Instant Location & Dashboard Detection',
    description: 'Ground-truth meteorological parameters fetched from Open-Meteo WMO station network.',
    actionLabel: 'Load Bengaluru Prime Scenario',
    actionType: 'scenario',
    target: 'bengaluru_prime',
  },
  {
    step: 2,
    title: 'Ask WeatherGPT: 3-Hour Rain Window',
    description: 'Query: "Will it rain in my area in the next 3 hours?" WeatherGPT evaluates precipitation probability and barometric slope.',
    actionLabel: 'Ask WeatherGPT',
    actionType: 'ask',
    target: 'Will it rain in my area in the next 3 hours?',
  },
  {
    step: 3,
    title: 'Inspect Transparent "WHY?" Reasoning',
    description: 'Notice the transparent metrics card detailing Rain Probability, Expected Rainfall mm, and Time Window alongside the direct Verdict.',
    actionLabel: 'Verify Transparency',
    actionType: 'info',
  },
  {
    step: 4,
    title: 'Ask Contextual College Umbrella Advice',
    description: 'Query: "Should I carry an umbrella to college tomorrow morning?" Observe situational AI reasoning.',
    actionLabel: 'Ask Umbrella Question',
    actionType: 'ask',
    target: 'Should I carry an umbrella to college tomorrow morning?',
  },
  {
    step: 5,
    title: 'Trigger Severe Rainstorm Alert Scenario',
    description: 'Switch to the Rainstorm Alert scenario to showcase the Weather Alert Center and Nearby Rain Gear Shelters.',
    actionLabel: 'Load Severe Rainstorm',
    actionType: 'scenario',
    target: 'rainstorm_guntur',
  },
  {
    step: 6,
    title: 'Review "What should I do?" & Comfort Score',
    description: 'Inspect the AI Outdoor Comfort Estimate (0-100) and actionable daily precautions.',
    actionLabel: 'Scroll to Insights',
    actionType: 'scroll',
    target: 'insights-section',
  },
  {
    step: 7,
    title: 'Toggle Futuristic Theme & Radar',
    description: 'Switch between Dark Command Center and High-Contrast Daytime mode.',
    actionLabel: 'Toggle Theme',
    actionType: 'theme',
  },
];

export const HackathonDemoGuide: React.FC<HackathonDemoGuideProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  onAskQuestion,
  onToggleTheme,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[activeStepIndex];

  const handleStepAction = (step: typeof DEMO_STEPS[0]) => {
    if (step.actionType === 'scenario' && step.target) {
      onSelectScenario(step.target);
    } else if (step.actionType === 'ask' && step.target) {
      onAskQuestion(step.target);
      onClose();
    } else if (step.actionType === 'theme') {
      onToggleTheme();
    } else if (step.actionType === 'scroll') {
      const el = document.getElementById(step.target || '');
      el?.scrollIntoView({ behavior: 'smooth' });
      onClose();
    }
    if (activeStepIndex < DEMO_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-stone-900 border border-orange-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                Hindu AI Nexus 2026 Demo Flow
              </h2>
              <p className="text-xs text-stone-400">
                Round 2 • Problem Statement 5: 2-Minute Presentation Walkthrough
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* Active Highlight Step Banner */}
          <div className="p-5 rounded-2xl bg-orange-950/40 border border-orange-500/40 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Step {currentStep.step} of {DEMO_STEPS.length}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-900/60 text-amber-200 border border-orange-700">
                Interactive Presenter Trigger
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-display mb-1.5">
              {currentStep.title}
            </h3>

            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              {currentStep.description}
            </p>

            <button
              onClick={() => handleStepAction(currentStep)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{currentStep.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Sequence Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              2-Minute Evaluation Sequence
            </h4>
            {DEMO_STEPS.map((s, idx) => (
              <div
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  idx === activeStepIndex
                    ? 'bg-stone-800/90 border-orange-500/50 text-white shadow'
                    : idx < activeStepIndex
                    ? 'bg-stone-950/50 border-stone-800 text-stone-400'
                    : 'bg-stone-950/30 border-stone-900 text-stone-500 hover:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      idx < activeStepIndex
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : idx === activeStepIndex
                        ? 'bg-orange-500 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {idx < activeStepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span className="text-xs font-medium">{s.title}</span>
                </div>

                <span className="text-[10px] text-stone-400 font-mono">
                  {s.actionType}
                </span>
              </div>
            ))}
          </div>

          {/* Architectural Summary Callout */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Core Architectural Tenet</span>
            </div>
            <p className="leading-relaxed">
              Open-Meteo station measurements serve as the uncompromised source of truth. Gemini 3.8 Flash acts exclusively as the human-centered reasoning and interpretation engine. Weather measurements are never fabricated.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs">
          <span className="text-stone-500">Problem Statement 5 • WeatherGPT</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
