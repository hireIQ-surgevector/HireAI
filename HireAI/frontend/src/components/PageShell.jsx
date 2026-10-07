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
    <div className="app-layout [min-height:100vh] [display:flex] [background:#f7f8fa]">
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="app-sidebar [width:250px] [min-height:100vh] [display:flex] [flex-direction:column] [background:#ffffff] [border-right:1px_solid_#e8eaed] [position:fixed] [top:0] [left:0] [bottom:0] [z-index:100] [overflow:hidden] max-[1024px]:[width:220px] max-[768px]:[width:72px]">
        {/* LOGO */}

        <div className="app-sidebar-header [height:76px] [display:flex] [align-items:center] [padding:0_24px] [border-bottom:1px_solid_#eef0f2] max-[768px]:[justify-content:center] max-[768px]:[padding:0]">
          <Link to="/dashboard" className="app-logo [display:flex] [align-items:center] [gap:11px] [text-decoration:none] [color:inherit]">
            <div className="app-logo-mark [width:38px] [height:38px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#00b4d8] [color:white] [font-size:13px] [font-weight:700] [letter-spacing:0.5px] max-[768px]:[width:36px] max-[768px]:[height:36px]">HI</div>

            <span className="app-logo-text [font-size:20px] [font-weight:700] [color:#1f2937] max-[768px]:[display:none]">HireIQ</span>
          </Link>
        </div>

        {/* NAVIGATION */}

        <nav className="app-navigation [flex:1] [overflow-y:hidden] [padding:24px_14px] max-[768px]:[padding:18px_10px]">
          <div className="app-nav-label [padding:0_10px] [margin-bottom:10px] [font-size:10px] [font-weight:700] [letter-spacing:1px] [color:#9ca3af] max-[768px]:[display:none]">MENU</div>

          <div className="app-nav-items [display:flex] [flex-direction:column] [gap:5px]">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${(`app-nav-item ${isActive ? "app-nav-item-active" : ""}`)} [&.app-nav-item]:[min-height:44px] [&.app-nav-item]:[display:flex] [&.app-nav-item]:[align-items:center] [&.app-nav-item]:[gap:13px] [&.app-nav-item]:[padding:0_12px] [&.app-nav-item]:[border-radius:9px] [&.app-nav-item]:[text-decoration:none] [&.app-nav-item]:[color:#6b7280] [&.app-nav-item]:[font-size:14px] [&.app-nav-item]:[font-weight:500] [&.app-nav-item]:[transition:background_0.2s_ease,_color_0.2s_ease] hover:[&.app-nav-item]:[background:#f3f4f6] hover:[&.app-nav-item]:[color:#111827] [&.app-nav-item-active]:[background:#e8f5f3] [&.app-nav-item-active]:[color:#00b4d8] [&.app-nav-item-active]:[font-weight:600] hover:[&.app-nav-item-active]:[background:#e8f5f3] hover:[&.app-nav-item-active]:[color:#00b4d8] max-[768px]:[&.app-nav-item]:[justify-content:center] max-[768px]:[&.app-nav-item]:[padding:0]`}
                >
                  <Icon size={19} strokeWidth={1.8} />

                  <span className="max-[768px]:[.app-nav-item_&]:[display:none]">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* USER SECTION */}

        <div className="app-sidebar-user [display:flex] [align-items:center] [gap:10px] [padding:16px] [border-top:1px_solid_#eef0f2] max-[768px]:[justify-content:center] max-[768px]:[padding:14px_8px]">
          <div className="app-user-profile [flex:1] [min-width:0] [display:flex] [align-items:center] [gap:10px] max-[768px]:[flex:none]">
            <div className="app-user-avatar [width:38px] [height:38px] [flex-shrink:0] [display:flex] [align-items:center] [justify-content:center] [border-radius:50%] [background:#00b4d8] [color:white] [font-size:13px] [font-weight:700]">{getInitials(userName)}</div>

            <div className="app-user-details [min-width:0] max-[768px]:[display:none]">
              <div className="app-user-name [overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap] [font-size:13px] [font-weight:600] [color:#374151]">{userName}</div>

              <div className="app-user-role [margin-top:2px] [font-size:10px] [font-weight:600] [color:#9ca3af] [letter-spacing:0.4px]">{userRole}</div>
            </div>
          </div>

          <button
            type="button"
            className="app-logout-button [font:inherit] [width:36px] [height:36px] [flex-shrink:0] [display:flex] [align-items:center] [justify-content:center] [border:none] [border-radius:8px] [background:transparent] [color:#9ca3af] [cursor:pointer] [transition:background_0.2s_ease,_color_0.2s_ease] hover:[background:#fef2f2] hover:[color:#dc2626] max-[768px]:[display:none]"
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

      <main className="app-main [width:100%] [min-height:100vh] [margin-left:250px] [display:flex] [flex-direction:column] max-[1024px]:[margin-left:220px] max-[768px]:[margin-left:72px]">
        {/* TOPBAR */}

        <header className="app-topbar [min-height:76px] [display:flex] [align-items:center] [justify-content:space-between] [gap:24px] [padding:0_32px] [background:#ffffff] [border-bottom:1px_solid_#e8eaed] [position:sticky] [top:0] [z-index:50] max-[1024px]:[padding:0_24px] max-[768px]:[min-height:68px] max-[768px]:[padding:0_18px]">
          <div className="app-page-heading [min-width:0] [display:flex] [align-items:center] [gap:16px]">
            {backTo && (
              <Link to={backTo} className="app-back-button [display:inline-flex] [align-items:center] [gap:7px] [padding:8px_10px] [border-radius:8px] [text-decoration:none] [color:#6b7280] [font-size:13px] [font-weight:500] [transition:background_0.2s_ease,_color_0.2s_ease] hover:[background:#f3f4f6] hover:[color:#111827]">
                <ArrowLeft size={18} />

                <span className="max-[768px]:[.app-back-button_&]:[display:none]">Back</span>
              </Link>
            )}

            <div>
              <h1 className="app-page-title [margin:0] [font-size:20px] [font-weight:650] [color:#1f2937] max-[768px]:[font-size:18px]">{title}</h1>
            </div>
          </div>

          {actions && <div className="app-page-actions [display:flex] [align-items:center] [gap:10px] [flex-shrink:0]">{actions}</div>}
        </header>

        {/* PAGE CONTENT */}

        <section className="app-content [flex:1] [padding:32px] [overflow-x:hidden] max-[1024px]:[padding:24px] max-[768px]:[padding:18px]">
          <div className="app-content-inner [width:100%] [max-width:1400px] [margin:0_auto]">{children}</div>
        </section>
      </main>
    </div>
  );
}

export default PageShell;
