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
} from "../../utils/auth";

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
    <div className="app-layout [min-height:100vh] [display:flex] [background:#f5f7fb] [color:#1f2937] [font-family:Inter,ui-sans-serif,system-ui,sans-serif] max-[640px]:[flex-direction:column]">
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="app-sidebar [width:250px] [min-height:100vh] [display:flex] [flex-direction:column] [background:#ffffff] [border-right:1px_solid_#e8eaed] [box-shadow:4px_0_24px_rgba(15,23,42,0.025)] [position:fixed] [top:0] [left:0] [bottom:0] [z-index:100] [overflow:hidden] max-[1024px]:[width:220px] max-[768px]:[width:72px] max-[640px]:[position:sticky] max-[640px]:[top:0] max-[640px]:[bottom:auto] max-[640px]:[left:auto] max-[640px]:[width:100%] max-[640px]:[min-height:auto] max-[640px]:[height:62px] max-[640px]:[flex-direction:row] max-[640px]:[align-items:center] max-[640px]:[padding:0_10px] max-[640px]:[overflow:visible]">
        {/* LOGO */}

        <div className="app-sidebar-header [height:76px] [display:flex] [align-items:center] [padding:0_24px] [border-bottom:1px_solid_#eef0f2] max-[768px]:[justify-content:center] max-[768px]:[padding:0] max-[640px]:[height:62px] max-[640px]:[padding:0_8px] max-[640px]:[border-bottom:none]">
          <Link to="/dashboard" className="app-logo [display:flex] [align-items:center] [gap:11px] [text-decoration:none] [color:inherit]">
            <div className="app-logo-mark [width:38px] [height:38px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#00b4d8] [color:white] [font-size:13px] [font-weight:700] [letter-spacing:0.5px] max-[768px]:[width:36px] max-[768px]:[height:36px]">HI</div>

            <span className="app-logo-text [font-size:20px] [font-weight:700] [color:#1f2937] max-[768px]:[display:none]">HireIQ</span>
          </Link>
        </div>

        {/* NAVIGATION */}

        <nav className="app-navigation [flex:1] [overflow-y:auto] [padding:24px_14px] max-[768px]:[padding:18px_10px] max-[640px]:[min-width:0] max-[640px]:[padding:0_4px] max-[640px]:[overflow-x:auto] max-[640px]:[overflow-y:hidden] max-[640px]:[scrollbar-width:none]">
          <div className="app-nav-label [padding:0_10px] [margin-bottom:10px] [font-size:10px] [font-weight:700] [letter-spacing:1px] [color:#9ca3af] max-[768px]:[display:none]">MENU</div>

          <div className="app-nav-items [display:flex] [flex-direction:column] [gap:5px] max-[640px]:[flex-direction:row] max-[640px]:[width:max-content] max-[640px]:[min-width:100%] max-[640px]:[justify-content:space-around] max-[640px]:[gap:2px]">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  title={item.label}
                  className={({ isActive }) =>
                    `${(`app-nav-item ${isActive ? "app-nav-item-active" : ""}`)} [&.app-nav-item]:[min-height:44px] [&.app-nav-item]:[display:flex] [&.app-nav-item]:[align-items:center] [&.app-nav-item]:[gap:13px] [&.app-nav-item]:[padding:0_12px] [&.app-nav-item]:[border:1px_solid_transparent] [&.app-nav-item]:[border-radius:9px] [&.app-nav-item]:[text-decoration:none] [&.app-nav-item]:[color:#6b7280] [&.app-nav-item]:[font-size:14px] [&.app-nav-item]:[font-weight:500] [&.app-nav-item]:[transition:background_0.2s_ease,_color_0.2s_ease,_transform_0.2s_ease] hover:[&.app-nav-item]:[background:#f3f4f6] hover:[&.app-nav-item]:[color:#111827] hover:[&.app-nav-item]:[transform:translateX(2px)] [&.app-nav-item-active]:[background:#e8f5f3] [&.app-nav-item-active]:[border-color:#c9eee7] [&.app-nav-item-active]:[color:#087f8c] [&.app-nav-item-active]:[font-weight:600] hover:[&.app-nav-item-active]:[background:#e8f5f3] hover:[&.app-nav-item-active]:[color:#087f8c] focus-visible:[&.app-nav-item]:[outline:2px_solid_#00b4d8] focus-visible:[&.app-nav-item]:[outline-offset:2px] max-[768px]:[&.app-nav-item]:[justify-content:center] max-[768px]:[&.app-nav-item]:[padding:0] max-[640px]:[&.app-nav-item]:[min-width:40px] max-[640px]:[&.app-nav-item]:[min-height:40px] max-[640px]:[&.app-nav-item]:[padding:0]`}
                >
                  <Icon size={19} strokeWidth={1.8} />

                  <span className="max-[768px]:[.app-nav-item_&]:[display:none]">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* USER SECTION */}

        <div className="app-sidebar-user [display:flex] [align-items:center] [gap:10px] [padding:16px] [border-top:1px_solid_#eef0f2] max-[768px]:[justify-content:center] max-[768px]:[padding:14px_8px] max-[640px]:[display:none]">
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

      <main className="app-main [width:calc(100%_-_250px)] [min-width:0] [min-height:100vh] [margin-left:250px] [display:flex] [flex-direction:column] max-[1024px]:[width:calc(100%_-_220px)] max-[1024px]:[margin-left:220px] max-[768px]:[width:calc(100%_-_72px)] max-[768px]:[margin-left:72px] max-[640px]:[width:100%] max-[640px]:[min-height:calc(100vh-62px)] max-[640px]:[margin-left:0]">
        {/* TOPBAR */}

        <header className="app-topbar [min-height:72px] [display:flex] [align-items:center] [justify-content:space-between] [gap:24px] [padding:0_32px] [background:rgba(255,255,255,0.92)] [border-bottom:1px_solid_#e8eaed] [box-shadow:0_4px_18px_rgba(15,23,42,0.025)] [backdrop-filter:blur(12px)] [position:sticky] [top:0] [z-index:50] max-[1024px]:[padding:0_24px] max-[768px]:[min-height:68px] max-[768px]:[padding:0_18px] max-[640px]:[min-height:60px] max-[640px]:[padding:0_14px]">
          <div className="app-page-heading [min-width:0] [display:flex] [align-items:center] [gap:16px]">
            {backTo && (
              <Link to={backTo} className="app-back-button [display:inline-flex] [align-items:center] [gap:7px] [padding:8px_10px] [border-radius:8px] [text-decoration:none] [color:#6b7280] [font-size:13px] [font-weight:500] [transition:background_0.2s_ease,_color_0.2s_ease] hover:[background:#f3f4f6] hover:[color:#111827]">
                <ArrowLeft size={18} />

                <span className="max-[768px]:[.app-back-button_&]:[display:none]">Back</span>
              </Link>
            )}

            <div>
              <h1 className="app-page-title [margin:0] [font-size:21px] [font-weight:700] [letter-spacing:-0.025em] [color:#172033] max-[768px]:[font-size:18px]">{title}</h1>
            </div>
          </div>

          <div className="app-page-actions [display:flex] [align-items:center] [gap:10px] [flex-shrink:0]">
            {actions}
            <button
              type="button"
              aria-label="Log out"
              title="Log out"
              className="app-mobile-logout [display:none] max-[640px]:[display:inline-flex] [width:36px] [height:36px] [align-items:center] [justify-content:center] [border:1px_solid_#e8eaed] [border-radius:10px] [background:#fff] [color:#64748b] [cursor:pointer] hover:[background:#fef2f2] hover:[color:#dc2626] focus-visible:[outline:2px_solid_#00b4d8] focus-visible:[outline-offset:2px]"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <section className="app-content [flex:1] [padding:32px] [overflow-x:clip] [background:linear-gradient(180deg,_#f8fafc_0%,_#f3f6fa_100%)] max-[1024px]:[padding:24px] max-[768px]:[padding:18px] max-[480px]:[padding:14px] max-[640px]:[padding:14px]">
          <div className="app-content-inner [width:100%] [max-width:1480px] [margin:0_auto]">{children}</div>
        </section>
      </main>
    </div>
  );
}

export default PageShell;
