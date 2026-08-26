import { useEffect, useMemo, useState } from "react";
import { useLocation, NavLink, Link } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import {
  clearSession,
  fetchCurrentUser,
  getSession,
  isManager,
} from "../utils/auth";

const DashboardIcon = (props) => <LayoutGrid {...props} />;
const JobsIcon = (props) => <BriefcaseBusiness {...props} />;
const CandidatesIcon = (props) => <Users {...props} />;
const InterviewsIcon = (props) => <CalendarDays {...props} />;
const EvaluationsIcon = (props) => <BarChart3 {...props} />;
const OffersIcon = (props) => <FileText {...props} />;
const SettingsIcon = (props) => <Settings {...props} />;
const LogoutIcon = (props) => <LogOut {...props} />;

function PageShell({ title, active, actions, children, backTo }) {
  const location = useLocation();
  const [session, setSession] = useState(getSession());
  const [loadingUser, setLoadingUser] = useState(!getSession());

  useEffect(() => {
    const syncSession = async () => {
      const current = getSession();
      if (!current) {
        setLoadingUser(false);
        return;
      }
      try {
        const fresh = await fetchCurrentUser();
        if (fresh?.user) {
          setSession(getSession());
        } else {
          setSession(current);
        }
      } finally {
        setLoadingUser(false);
      }
    };
    syncSession();
  }, []);

  const shownNavItems = useMemo(() => {
    const items = [
      {
        to: "/dashboard",
        key: "dashboard",
        label: "Dashboard",
        icon: <DashboardIcon size={15} />,
      },
      {
        to: "/jobs",
        key: "jobs",
        label: "Job Openings",
        icon: <JobsIcon size={15} />,
      },
      {
        to: "/candidates",
        key: "candidates",
        label: "Candidates",
        icon: <CandidatesIcon size={15} />,
      },
      {
        to: "/interviews",
        key: "interviews",
        label: "Interviews",
        icon: <InterviewsIcon size={15} />,
      },
      {
        to: "/evaluations",
        key: "evaluations",
        label: "Evaluations",
        icon: <EvaluationsIcon size={15} />,
      },
      {
        to: "/offers",
        key: "offers",
        label: "Offer Letters",
        icon: <OffersIcon size={15} />,
      },
      {
        to: "/settings",
        key: "settings",
        label: "Settings",
        icon: <SettingsIcon size={15} />,
      },
    ];

    if (!isManager(session)) {
      return items.filter(
        (item) =>
          !["/jobs", "/offers", "/settings", "/evaluations"].includes(item.to),
      );
    }
    return items;
  }, [session]);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const userName = session?.name || "User";
  const userRole = (session?.role || "manager").toUpperCase();

  return (
    <div className="screen layout active">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">HI</div>
          <span className="sidebar-logo-text">HireIQ</span>
        </div>
        {shownNavItems.map((item) => (
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
            {userName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="sidebar-user">{userName}</div>
            <div className="sidebar-email">{userRole}</div>
          </div>
          <button
            type="button"
            className="logout-btn"
            title="Logout"
            onClick={handleLogout}
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </aside>
      <div className="main-panel">
        <div className="topbar">
          {backTo ? (
            <Link to={backTo} className="back-link">
              ← Back
            </Link>
          ) : null}
          <span className="topbar-title">{title}</span>
          {actions}
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default PageShell;
