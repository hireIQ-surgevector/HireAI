// import { useEffect, useMemo, useState } from "react";
// import { NavLink, Link, useNavigate } from "react-router-dom";
// import {
//   LayoutGrid,
//   BriefcaseBusiness,
//   Users,
//   CalendarDays,
//   BarChart3,
//   FileText,
//   Settings,
//   LogOut,
// } from "lucide-react";

// import {
//   clearSession,
//   fetchCurrentUser,
//   getSession,
//   isManager,
// } from "../utils/auth";

// /* =========================
//    NAVIGATION CONFIGURATION
// ========================= */

// const NAV_ITEMS = [
//   {
//     to: "/dashboard",
//     label: "Dashboard",
//     key: "dashboard",
//     icon: LayoutGrid,
//     managerOnly: false,
//   },
//   {
//     to: "/jobs",
//     label: "Job Openings",
//     key: "jobs",
//     icon: BriefcaseBusiness,
//     managerOnly: true,
//   },
//   {
//     to: "/candidates",
//     label: "Candidates",
//     key: "candidates",
//     icon: Users,
//     managerOnly: false,
//   },
//   {
//     to: "/interviews",
//     label: "Interviews",
//     key: "interviews",
//     icon: CalendarDays,
//     managerOnly: false,
//   },
//   {
//     to: "/evaluations",
//     label: "Evaluations",
//     key: "evaluations",
//     icon: BarChart3,
//     managerOnly: true,
//   },
//   {
//     to: "/offers",
//     label: "Offer Letters",
//     key: "offers",
//     icon: FileText,
//     managerOnly: true,
//   },
//   {
//     to: "/settings",
//     label: "Settings",
//     key: "settings",
//     icon: Settings,
//     managerOnly: true,
//   },
// ];

// /* =========================
//    USER AVATAR INITIALS
// ========================= */

// function getInitials(name) {
//   if (!name) return "U";

//   return name
//     .trim()
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part.charAt(0))
//     .join("")
//     .toUpperCase();
// }

// /* =========================
//    PAGE SHELL
// ========================= */

// function PageShell({
//   title,
//   actions,
//   children,
//   backTo,
// }) {
//   const navigate = useNavigate();

//   const [session, setSession] = useState(() => getSession());

//   /* =========================
//      SYNC CURRENT USER
//   ========================= */

//   useEffect(() => {
//     const syncCurrentUser = async () => {
//       const currentSession = getSession();

//       if (!currentSession) {
//         return;
//       }

//       try {
//         await fetchCurrentUser();

//         const updatedSession = getSession();

//         if (updatedSession) {
//           setSession(updatedSession);
//         }
//       } catch (error) {
//         console.error(
//           "Failed to refresh current user:",
//           error
//         );

//         // Keep the existing session if refresh fails.
//         setSession(currentSession);
//       }
//     };

//     syncCurrentUser();
//   }, []);

//   /* =========================
//      ROLE-BASED NAVIGATION
//   ========================= */

//   const navItems = useMemo(() => {
//     const manager = isManager(session);

//     return NAV_ITEMS.filter(
//       (item) => !item.managerOnly || manager
//     );
//   }, [session]);

//   /* =========================
//      LOGOUT
//   ========================= */

//   const handleLogout = () => {
//     clearSession();
//     navigate("/login", { replace: true });
//   };

//   /* =========================
//      USER DETAILS
//   ========================= */

//   const userName = session?.name || "User";

//   const userRole = (
//     session?.role || "User"
//   ).toUpperCase();

//   return (
//     <div className="screen layout active">

//       {/* =========================
//           SIDEBAR
//       ========================= */}

//       <aside className="sidebar">

//         {/* LOGO */}

//         <div className="sidebar-logo">
//           <div className="sidebar-logo-icon">
//             HI
//           </div>

//           <span className="sidebar-logo-text">
//             HireIQ
//           </span>
//         </div>

//         {/* NAVIGATION */}

//         <nav className="sidebar-nav">
//           {navItems.map((item) => {
//             const Icon = item.icon;

//             return (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 className={({ isActive }) =>
//                   `nav-item ${
//                     isActive ? "active" : ""
//                   }`
//                 }
//               >
//                 <span className="nav-icon">
//                   <Icon size={17} />
//                 </span>

//                 <span>
//                   {item.label}
//                 </span>
//               </NavLink>
//             );
//           })}
//         </nav>

//         {/* USER FOOTER */}

//         <div className="sidebar-footer">

//           <div
//             className="avatar"
//             style={{
//               background: "var(--teal)",
//               color: "#fff",
//             }}
//           >
//             {getInitials(userName)}
//           </div>

//           <div className="sidebar-user-info">
//             <div className="sidebar-user">
//               {userName}
//             </div>

//             <div className="sidebar-email">
//               {userRole}
//             </div>
//           </div>

//           <button
//             type="button"
//             className="logout-btn"
//             title="Logout"
//             onClick={handleLogout}
//           >
//             <LogOut size={17} />
//           </button>

//         </div>

//       </aside>

//       {/* =========================
//           MAIN AREA
//       ========================= */}

//       <main className="main-panel">

//         <header className="topbar">

//           {backTo && (
//             <Link
//               to={backTo}
//               className="back-link"
//             >
//               ← Back
//             </Link>
//           )}

//           <h1 className="topbar-title">
//             {title}
//           </h1>

//           {actions && (
//             <div className="topbar-actions">
//               {actions}
//             </div>
//           )}

//         </header>

//         {/* PAGE CONTENT */}

//         <div className="content">
//           {children}
//         </div>

//       </main>

//     </div>
//   );
// }

// export default PageShell;

import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
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
    const syncCurrentUser = async () => {
      const currentSession = getSession();

      if (!currentSession) return;

      try {
        await fetchCurrentUser();

        const updatedSession = getSession();

        if (updatedSession) {
          setSession(updatedSession);
        }
      } catch (error) {
        console.error("Failed to refresh current user:", error);

        setSession(currentSession);
      }
    };

    syncCurrentUser();
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
