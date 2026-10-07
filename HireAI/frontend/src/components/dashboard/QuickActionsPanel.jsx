import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle, UploadCloud } from "lucide-react";

const ACTIONS = [
  {
    key: "post-job",
    to: "/post-job",
    label: "Post a New Job",
    description: "Create a job opening for your team.",
    icon: PlusCircle,
  },
  {
    key: "upload-resume",
    to: "/upload-resume",
    label: "Add Candidates",
    description: "Upload resumes to bring in new candidates.",
    icon: UploadCloud,
  },
];

function QuickActionsPanel() {
  return (
    <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
      <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
        <div>
          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">
            Quick Actions
          </h3>
          <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]">
            Common tasks, one click away.
          </p>
        </div>
      </div>

      <div className="quick-actions-list [display:flex] [flex-direction:column] [gap:10px]">
        {ACTIONS.map(({ key, to, label, description, icon: ActionIcon }) => (
          <Link
            key={key}
            to={to}
            className="quick-action-row [display:flex] [align-items:center] [gap:14px] [padding:14px] [border:1px_solid_#e2e8f0] [border-radius:10px] [transition:background_0.2s_ease,_border-color_0.2s_ease,_transform_0.15s_ease] hover:[background:#e8f0fb] hover:[border-color:#133f7d] hover:[transform:translateY(-1px)] max-[700px]:[padding:12px] max-[700px]:[gap:10px]"
          >
            <div className="quick-action-icon [width:42px] [height:42px] [flex-shrink:0] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#e8f0fb] [color:#133f7d]">
              <ActionIcon size={18} />
            </div>
            <div className="quick-action-main [flex:1] [min-width:0]">
              <div className="quick-action-label [font-size:14px] [font-weight:700] [color:#1e293b]">
                {label}
              </div>
              <div className="quick-action-description muted [font-size:12px] [color:#64748b] [margin-top:2px]">
                {description}
              </div>
            </div>
            <ArrowRight
              size={16}
              className="quick-action-arrow [flex-shrink:0] [color:#64748b] [transition:transform_0.15s_ease,_color_0.15s_ease] [.quick-action-row:hover_&]:[color:#133f7d] [.quick-action-row:hover_&]:[transform:translateX(3px)]"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuickActionsPanel;
