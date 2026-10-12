import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileText,
  ScanSearch,
  Users,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getSession, isManager } from "../../utils/auth";
import { USER_GUIDE_EVENT } from "../../utils/userGuide";

const MANAGER_STEPS = [
  {
    target: "dashboard",
    path: "/dashboard",
    title: "Your hiring overview",
    description:
      "Start here for a snapshot of open roles, candidates, upcoming interviews, and pending offers. Quick actions help you jump into common tasks.",
    icon: BookOpen,
  },
  {
    target: "jobs",
    path: "/jobs",
    title: "Create a job opening",
    description:
      "Add a role with its description, experience range, salary range, and required skills. These details guide candidate matching and keep offers within the approved range.",
    icon: BriefcaseBusiness,
  },
  {
    target: "candidates",
    path: "/candidates",
    title: "Build your candidate pipeline",
    description:
      "Upload resumes to add candidates, review their profiles, and track each person as they move through your hiring process.",
    icon: Users,
  },
  {
    target: "matcher",
    path: "/candidate-matcher",
    title: "Find suitable candidates",
    description:
      "Choose a job and calculate match scores. Review matched and missing skills alongside the score before deciding who should move forward.",
    icon: ScanSearch,
  },
  {
    target: "interviews",
    path: "/interviews",
    title: "Schedule and manage interviews",
    description:
      "Schedule interview rounds, review upcoming interviews, and open completed interviews to view their details.",
    icon: CalendarDays,
  },
  {
    target: "evaluations",
    path: "/evaluations",
    title: "Record an evaluation",
    description:
      "Evaluate candidates after their interviews. Your decision moves them forward, rejects them, or starts the offer process.",
    icon: Check,
  },
  {
    target: "offers",
    path: "/offers",
    title: "Manage offers and onboarding",
    description:
      "Track offer status, update it as the candidate responds, and move accepted candidates into onboarding.",
    icon: FileText,
  },
];

const TEAM_STEPS = [
  MANAGER_STEPS[0],
  MANAGER_STEPS[2],
  MANAGER_STEPS[4],
];

function getGuideKey(session) {
  const userName = (session?.name || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return `hireiq-user-guide-dismissed-${session?.role || "user"}-${userName}`;
}

function UserGuideTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const manager = isManager(session);
  const steps = manager ? MANAGER_STEPS : TEAM_STEPS;
  const guideKey = getGuideKey(session);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const attemptedAutoStart = useRef("");
  const activeStep = steps[stepIndex];

  const closeTour = useCallback(() => {
    setActive(false);
    localStorage.setItem(guideKey, "true");
  }, [guideKey]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    navigate(steps[0].path);
  }, [navigate, steps]);

  useEffect(() => {
    const handleOpenGuide = () => startTour();
    window.addEventListener(USER_GUIDE_EVENT, handleOpenGuide);

    return () => {
      window.removeEventListener(USER_GUIDE_EVENT, handleOpenGuide);
    };
  }, [startTour]);

  useEffect(() => {
    if (
      !session?.token
      || location.pathname !== "/dashboard"
      || attemptedAutoStart.current === guideKey
      || localStorage.getItem(guideKey)
    ) {
      return;
    }

    attemptedAutoStart.current = guideKey;
    setStepIndex(0);
    setActive(true);
  }, [guideKey, location.pathname, session?.token]);

  useEffect(() => {
    if (!active || !activeStep) return undefined;

    const target = document.querySelector(
      `[data-guide-target="${activeStep.target}"]`,
    );

    target?.setAttribute("data-guide-highlight", "true");

    return () => {
      target?.removeAttribute("data-guide-highlight");
    };
  }, [active, activeStep, location.pathname]);

  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeTour();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, closeTour]);

  const goToStep = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    setStepIndex(nextIndex);
    navigate(steps[nextIndex].path);
  };

  if (!active || !activeStep) return null;

  const StepIcon = activeStep.icon;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <>
      <style>
        {`
          [data-guide-highlight="true"] {
            position: relative !important;
            z-index: 1001 !important;
            outline: 3px solid #00b4d8 !important;
            outline-offset: 3px !important;
            box-shadow: 0 0 0 7px rgba(0, 180, 216, 0.18) !important;
          }
        `}
      </style>
      <section
        aria-label="Application tour"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[1002] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 max-[640px]:bottom-3 max-[640px]:right-3"
        role="dialog"
      >
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-cyan-500 transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <StepIcon size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-700">
                  HireIQ guide · {stepIndex + 1} of {steps.length}
                </p>
                <h2 className="mb-0 mt-1 text-base font-bold text-slate-900">
                  {activeStep.title}
                </h2>
              </div>
            </div>
            <button
              aria-label="Close application tour"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-cyan-600"
              onClick={closeTour}
              type="button"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="mb-5 mt-0 text-sm leading-6 text-slate-600">
            {activeStep.description}
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stepIndex === 0}
              onClick={() => goToStep(stepIndex - 1)}
              type="button"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              onClick={closeTour}
              type="button"
            >
              End tour
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
              onClick={() => {
                if (isLastStep) {
                  closeTour();
                } else {
                  goToStep(stepIndex + 1);
                }
              }}
              type="button"
            >
              {isLastStep ? "Finish" : "Next"}
              {isLastStep ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <ArrowRight size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default UserGuideTour;
