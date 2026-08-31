import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  BarChart3,
  FileText,
  LogOut,
  ArrowLeft,
  ScanSearch,
} from "lucide-react";

import {
  clearSession,
  fetchCurrentUser,
  getSession,
  isManager,
} from "../utils/auth";

/* =========================
   NAVIGATION CONFIGURATION
========================= */

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    managerOnly: false,
  },
  {
    to: "/jobs",
    label: "Job Openings",
    icon: BriefcaseBusiness,
    managerOnly: true,
  },
  {
    to: "/candidates",
    label: "Candidates",
    icon: Users,
    managerOnly: false,
  },
  {
    to: "/candidate-matcher",
    label: "Candidate Matcher",
    icon: ScanSearch,
    managerOnly: true,
  },
  {
    to: "/interviews",
    label: "Interviews",
    icon: CalendarDays,
    managerOnly: false,
  },
  {
    to: "/evaluations",
    label: "Evaluations",
    icon: BarChart3,
    managerOnly: true,
  },
  {
    to: "/offers",
    label: "Offer Letters",
    icon: FileText,
    managerOnly: true,
  },
];

/* =========================
   HELPER
========================= */

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

/* =========================
   PAGE SHELL
========================= */

function PageShell({ title, actions, children, backTo }) {
  const navigate = useNavigate();

  const [session, setSession] = useState(() => getSession());

  /* =========================
     REFRESH USER SESSION
  ========================= */

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      const currentSession = getSession();

      if (!currentSession) {
        return;
      }

      try {
        await fetchCurrentUser();

        const updatedSession = getSession();

        if (isMounted && updatedSession) {
          setSession(updatedSession);
        }
      } catch (error) {
        console.error("Failed to refresh current user:", error);
      }
    };

    syncCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =========================
     ROLE BASED NAVIGATION
  ========================= */

  const navItems = useMemo(() => {
    const manager = isManager(session);

    return NAV_ITEMS.filter((item) => !item.managerOnly || manager);
  }, [session]);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    clearSession();

    setSession(null);

    navigate("/login", {
      replace: true,
    });
  };

  const userName = session?.name || "User";

  const userRole = (session?.role || "User").toUpperCase();

  return (
    <div className="app-layout">
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="app-sidebar">
        {/* LOGO */}

        <div className="app-sidebar-header">
          <Link to="/dashboard" className="app-logo">
            <div className="app-logo-mark">HI</div>

            <span className="app-logo-text">HireIQ</span>
          </Link>
        </div>

        {/* NAVIGATION */}

        <nav className="app-navigation">
          <div className="app-nav-label">MENU</div>

          <div className="app-nav-items">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-nav-item ${isActive ? "app-nav-item-active" : ""}`
                  }
                >
                  <Icon size={19} strokeWidth={1.8} />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* USER SECTION */}

        <div className="app-sidebar-user">
          <div className="app-user-profile">
            <div className="app-user-avatar">{getInitials(userName)}</div>

            <div className="app-user-details">
              <div className="app-user-name">{userName}</div>

              <div className="app-user-role">{userRole}</div>
            </div>
          </div>

          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN APPLICATION AREA
      ========================= */}

      <main className="app-main">
        {/* TOPBAR */}

        <header className="app-topbar">
          <div className="app-page-heading">
            {backTo && (
              <Link to={backTo} className="app-back-button">
                <ArrowLeft size={18} />

                <span>Back</span>
              </Link>
            )}

            <div>
              <h1 className="app-page-title">{title}</h1>
            </div>
          </div>

          {actions && <div className="app-page-actions">{actions}</div>}
        </header>

        {/* PAGE CONTENT */}

        <section className="app-content">
          <div className="app-content-inner">{children}</div>
        </section>
      </main>
    </div>
  );
}

export default PageShell;
