import { Send, UserCheck, Users, UserX } from "lucide-react";

const SUMMARY_ITEMS = [
  { label: "Total Candidates", countKey: "all", icon: Users, iconClass: "icon-blue", iconStyle: "[background:#e8f0fb] [color:#133f7d]" },
  { label: "Active Pipeline", countKey: "active", icon: UserCheck, iconClass: "icon-teal", iconStyle: "[background:#e0f7fa] [color:#006064]" },
  { label: "Offers Sent", countKey: "offered", icon: Send, iconClass: "icon-green", iconStyle: "[background:#dcfce7] [color:#166534]" },
  { label: "Rejected", countKey: "rejected", icon: UserX, iconClass: "icon-red", iconStyle: "[background:#fee2e2] [color:#991b1b]" },
];

function CandidateSummaryCards({ counts }) {
  return (
    <div className="candidate-summary-grid [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:14px] [margin-bottom:18px] max-[960px]:[grid-template-columns:repeat(2,_1fr)] max-[640px]:[grid-template-columns:1fr]">
      {SUMMARY_ITEMS.map(({ label, countKey, icon: Icon, iconClass, iconStyle }) => (
        <div
          key={countKey}
          className="[background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:16px] [display:flex] [align-items:center] [gap:12px]"
        >
          <div className={`candidate-summary-icon ${iconClass} [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] ${iconStyle}`}>
            <Icon size={20} />
          </div>
          <div>
            <div className="candidate-summary-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">
              {label}
            </div>
            <div className="candidate-summary-value [font-size:24px] [font-weight:800] [color:#1e293b] [margin-top:2px]">
              {counts[countKey]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CandidateSummaryCards;
