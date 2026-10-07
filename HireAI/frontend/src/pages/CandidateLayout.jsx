import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Home,
  MessageCircleMore,
} from "lucide-react";

const DashboardIcon = (props) => <LayoutGrid {...props} />;
const JobsIcon = (props) => <BriefcaseBusiness {...props} />;
const CandidatesIcon = (props) => <Users {...props} />;
const InterviewsIcon = (props) => <CalendarDays {...props} />;
const EvaluationsIcon = (props) => <BarChart3 {...props} />;
const OffersIcon = (props) => <FileText {...props} />;
const SettingsIcon = (props) => <Settings {...props} />;
const LogoutIcon = (props) => <LogOut {...props} />;
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
  const location = useLocation();
  return (
    <div className="screen layout active [min-height:100vh] [display:flex] [flex-direction:row] [background:#f8fafc] max-[960px]:[flex-direction:column]">
      <aside className="sidebar [width:215px] [min-height:100vh] [background:#0d2d5e] [display:flex] [flex-direction:column] [padding:18px_0] [flex-shrink:0] [position:sticky] [top:0] [align-self:flex-start] max-[960px]:[width:100%] max-[960px]:[min-height:auto]">
        <div className="sidebar-logo [padding:0_18px_20px] [display:flex] [align-items:center] [gap:8px]">
          <div className="sidebar-logo-icon [width:30px] [height:30px] [border-radius:7px] [background:#fff] [display:flex] [align-items:center] [justify-content:center] [font-weight:800] [color:#133f7d] [font-size:13px]">SV</div>
          <span className="sidebar-logo-text [font-weight:800] [color:#fff] [font-size:15px]">TalentSync</span>
        </div>
        {candidateNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${(`nav-item ${isActive || active === item.key ? "active" : ""}`)} [&.nav-item]:[display:flex] [&.nav-item]:[align-items:center] [&.nav-item]:[gap:11px] [&.nav-item]:[padding:9px_12px] [&.nav-item]:[margin:1px_8px] [&.nav-item]:[border-radius:8px] [&.nav-item]:[color:rgba(255,255,255,0.65)] [&.nav-item]:[font-size:13px] [&.nav-item]:[transition:all_0.15s] hover:[&.nav-item]:[background:rgba(255,255,255,0.18)] hover:[&.nav-item]:[color:#fff] hover:[&.nav-item]:[font-weight:600] [&.nav-item.active]:[background:rgba(255,255,255,0.18)] [&.nav-item.active]:[color:#fff] [&.nav-item.active]:[font-weight:600]`}
          >
            <span className="nav-icon [font-size:15px] [width:20px] [text-align:center]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="sidebar-footer [margin-top:auto] [padding:14px_18px] [border-top:1px_solid_rgba(255,255,255,0.1)] [display:flex] [align-items:center] [gap:10px]">
          <div
            className="avatar [background:#00b4d8] [color:#fff] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]"

          >
            RK
          </div>
          <div>
            <div className="sidebar-user [color:#fff] [font-size:13px] [font-weight:600] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis]">Rahul Kumar</div>
            <div className="sidebar-email [color:rgba(255,255,255,0.5)] [font-size:11px]">Candidate</div>
          </div>
        </div>
      </aside>
      <div className="main-panel [flex:1_1_auto] [display:flex] [flex-direction:column] [min-height:100vh] [min-width:0] [overflow:hidden] [background:#f8fafc]">
        <div className="topbar [height:58px] [background:rgba(255,255,255,0.96)] [border-bottom:1px_solid_#e2e8f0] [display:flex] [align-items:center] [padding:0_24px] [gap:14px] [position:sticky] [top:0] [z-index:10] [backdrop-filter:blur(10px)]">
          <span className="topbar-title [font-size:17px] [font-weight:700] [color:#1e293b] [flex:1] [margin:0]">{title}</span>
        </div>
        <div className="content [padding:24px_28px_36px] [flex:1] [min-height:0] [overflow-y:auto] [background:linear-gradient(180deg,_#f8fafc_0%,_#f4f7fb_100%)] [display:flex] [flex-direction:column] [align-items:stretch]">{children}</div>
      </div>
    </div>
  );
}

export default CandidateLayout;
