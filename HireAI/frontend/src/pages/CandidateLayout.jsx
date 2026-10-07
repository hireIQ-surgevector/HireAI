import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  Home,
  MessageCircleMore,
} from "lucide-react";

const InterviewsIcon = (props) => <CalendarDays {...props} />;
const HomeIcon = (props) => <Home {...props} />;
const FeedbackIcon = (props) => <MessageCircleMore {...props} />;
const DocumentIcon = (props) => <FileText {...props} />;

const candidateNavItems = [
  {
    to: "/candidate-home",
    key: "candidate-home",
    label: "My Applications",
    icon: <HomeIcon size={15} />,
  },
  {
    to: "/candidate-interview",
    key: "candidate-interview",
    label: "Upcoming Interview",
    icon: <InterviewsIcon size={15} />,
  },
  {
    to: "/candidate-feedback",
    key: "candidate-feedback",
    label: "My Feedback",
    icon: <FeedbackIcon size={15} />,
  },
  {
    to: "/candidate-offer",
    key: "candidate-offer",
    label: "Offer Letter",
    icon: <DocumentIcon size={15} />,
  },
];

function CandidateLayout({ title, active, children }) {
  return (
    <div className="screen layout active [min-height:100vh] [display:flex] [flex-direction:row] [background:#f5f7fb] [font-family:Inter,ui-sans-serif,system-ui,sans-serif] max-[960px]:[flex-direction:column]">
      <aside className="sidebar [width:232px] [min-height:100vh] [background:#fff] [border-right:1px_solid_#e8eaed] [box-shadow:4px_0_24px_rgba(15,23,42,0.025)] [display:flex] [flex-direction:column] [padding:20px_0] [flex-shrink:0] [position:sticky] [top:0] [align-self:flex-start] max-[960px]:[width:100%] max-[960px]:[min-height:auto] max-[960px]:[position:sticky] max-[960px]:[z-index:20] max-[960px]:[padding:12px_16px]">
        <div className="sidebar-logo [padding:0_20px_22px] [display:flex] [align-items:center] [gap:10px] max-[960px]:[padding:0_4px_12px]">
          <div className="sidebar-logo-icon [width:36px] [height:36px] [border-radius:10px] [background:#00b4d8] [display:flex] [align-items:center] [justify-content:center] [font-weight:800] [color:#fff] [font-size:12px] [box-shadow:0_4px_10px_rgba(0,180,216,0.2)]">HI</div>
          <span className="sidebar-logo-text [font-weight:800] [color:#172033] [font-size:16px] [letter-spacing:-0.02em]">HireIQ</span>
        </div>
        <nav aria-label="Candidate navigation" className="[display:flex] [flex-direction:column] [gap:5px] [padding:0_12px] max-[960px]:[flex-direction:row] max-[960px]:[padding:0] max-[960px]:[overflow-x:auto] max-[960px]:[scrollbar-width:none]">
          {candidateNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${(`nav-item ${isActive || active === item.key ? "active" : ""}`)} [&.nav-item]:[min-height:42px] [&.nav-item]:[display:flex] [&.nav-item]:[align-items:center] [&.nav-item]:[gap:11px] [&.nav-item]:[padding:0_12px] [&.nav-item]:[border:1px_solid_transparent] [&.nav-item]:[border-radius:10px] [&.nav-item]:[color:#64748b] [&.nav-item]:[font-size:13px] [&.nav-item]:[font-weight:500] [&.nav-item]:[white-space:nowrap] [&.nav-item]:[text-decoration:none] [&.nav-item]:[transition:all_0.18s_ease] hover:[&.nav-item]:[background:#f1f5f9] hover:[&.nav-item]:[color:#172033] [&.nav-item.active]:[background:#e8f5f3] [&.nav-item.active]:[border-color:#c9eee7] [&.nav-item.active]:[color:#087f8c] [&.nav-item.active]:[font-weight:700] focus-visible:[&.nav-item]:[outline:2px_solid_#00b4d8] focus-visible:[&.nav-item]:[outline-offset:2px] max-[960px]:[&.nav-item]:[min-height:38px] max-[960px]:[&.nav-item]:[padding:0_10px] max-[960px]:[&.nav-item]:[flex-shrink:0]`
              }
            >
              <span className="[display:flex] [width:20px] [justify-content:center]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer [margin-top:auto] [padding:14px_20px] [border-top:1px_solid_#eef0f2] [display:flex] [align-items:center] [gap:10px] max-[960px]:[display:none]">
          <div
            className="avatar [background:#00b4d8] [color:#fff] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]"

          >
            RK
          </div>
          <div>
            <div className="sidebar-user [color:#172033] [font-size:13px] [font-weight:600] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis]">Rahul Kumar</div>
            <div className="sidebar-email [color:#94a3b8] [font-size:11px]">Candidate</div>
          </div>
        </div>
      </aside>
      <div className="main-panel [flex:1_1_auto] [display:flex] [flex-direction:column] [min-height:100vh] [min-width:0] [overflow:hidden] [background:#f5f7fb]">
        <div className="topbar [min-height:64px] [background:rgba(255,255,255,0.9)] [border-bottom:1px_solid_#e8eaed] [box-shadow:0_4px_18px_rgba(15,23,42,0.025)] [display:flex] [align-items:center] [padding:0_28px] [gap:14px] [position:sticky] [top:0] [z-index:10] [backdrop-filter:blur(12px)] max-[960px]:[min-height:54px] max-[960px]:[padding:0_18px]">
          <span className="topbar-title [font-size:18px] [font-weight:700] [letter-spacing:-0.02em] [color:#172033] [flex:1] [margin:0]">{title}</span>
        </div>
        <div className="content [padding:28px_32px_40px] [flex:1] [min-height:0] [overflow-y:auto] [background:linear-gradient(180deg,_#f8fafc_0%,_#f3f6fa_100%)] [display:flex] [flex-direction:column] [align-items:stretch] max-[960px]:[padding:22px_20px_32px] max-[600px]:[padding:16px_14px_24px]">{children}</div>
      </div>
    </div>
  );
}

export default CandidateLayout;
