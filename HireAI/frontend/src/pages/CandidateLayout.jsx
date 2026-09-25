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
    <div className="screen layout active">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SV</div>
          <span className="sidebar-logo-text">TalentSync</span>
        </div>
        {candidateNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive || active === item.key ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <div
            className="avatar"
            style={{ background: "var(--teal)", color: "#fff" }}
          >
            RK
          </div>
          <div>
            <div className="sidebar-user">Rahul Kumar</div>
            <div className="sidebar-email">Candidate</div>
          </div>
        </div>
      </aside>
      <div className="main-panel">
        <div className="topbar">
          <span className="topbar-title">{title}</span>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default CandidateLayout;
