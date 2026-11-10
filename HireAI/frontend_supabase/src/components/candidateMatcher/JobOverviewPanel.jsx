import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Users,
} from "lucide-react";

const normalizeSkills = (skills) => {
  if (!skills) return [];

  return (Array.isArray(skills) ? skills : String(skills).split(/[,;|]/))
    .flatMap((skill) => String(skill).split(/[,;|]/))
    .map((skill) => skill.trim())
    .filter(Boolean);
};

function JobOverviewPanel({
  job,
  candidateCount,
  strongMatches,
  goodMatches,
  loading,
}) {
  const primarySkills = normalizeSkills(job.mandatory_skills);
  const secondarySkills = normalizeSkills(job.required_skills);

  return (
    <section className="matcher-job-details sticky top-[72px] z-40 mb-5 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl max-[640px]:top-[60px] max-[640px]:p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#133f7d]">
            <BriefcaseBusiness size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 truncate text-base font-bold text-slate-900">
              {job.title || "Selected job"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {job.department && <span>{job.department}</span>}
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {job.location}
                </span>
              )}
              <span>{job.min_exp || 0}+ years experience</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 max-[480px]:w-full max-[480px]:justify-between">
          <Kpi icon={Users} label="Candidates" value={loading ? "—" : candidateCount} />
          <Kpi icon={Award} label="Strong" value={loading ? "—" : strongMatches} />
          <Kpi icon={CheckCircle2} label="Good" value={loading ? "—" : goodMatches} />
        </div>
      </div>

      {(primarySkills.length > 0 || secondarySkills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3">
          {primarySkills.length > 0 && (
            <SkillGroup label="Primary" skills={primarySkills} color="violet" />
          )}
          {secondarySkills.length > 0 && (
            <SkillGroup label="Secondary" skills={secondarySkills} color="sky" />
          )}
        </div>
      )}

    </section>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-[82px] items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2 max-[480px]:min-w-0 max-[480px]:flex-col max-[480px]:gap-0.5 max-[480px]:px-2">
      <Icon size={15} className="text-[#133f7d]" />
      <span className="text-xs font-semibold text-slate-800">{value}</span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function SkillGroup({ label, skills, color }) {
  const colors =
    color === "violet"
      ? "border-violet-100 bg-violet-50 text-violet-800"
      : "border-sky-100 bg-sky-50 text-sky-800";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, index) => (
          <span
            key={`${label}-${skill}-${index}`}
            className={`rounded-full border px-2 py-1 text-[11px] leading-none ${colors}`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default JobOverviewPanel;
