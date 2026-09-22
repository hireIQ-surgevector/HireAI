import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
// test to see if dev branch is mad in the repo
import "./App.css";
import LoginPage from "./pages/LoginPage";
import {
  AUTH_CHANGED_EVENT,
  fetchCurrentUser,
  getSession,
} from "./utils/auth";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import JobsPage from "./pages/JobsPage";
import PostJobPage from "./pages/PostJobPage";
import EditJobPage from "./pages/EditJobPage";
import JobCandidatesPage from "./pages/JobCandidatesPage";
import CandidateMatcherPage from "./pages/CandidateMatcherPage";
import ResetSentPage from "./pages/ResetSentPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import EditCandidatePage from "./pages/EditCandidatePage";
import UploadResumePage from "./pages/UploadResumePage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewRoomPage from "./pages/InterviewRoomPage";
import ScheduleInterviewPage from "./pages/ScheduleInterviewPage";
import EditInterviewSchedulePage from "./pages/EditInterviewSchedulePage";
import EvaluationsPage from "./pages/EvaluationsPage";
import RejectCandidatePage from "./pages/RejectCandidatePage";
import RejectDonePage from "./pages/RejectDonePage";
import SendOfferPage from "./pages/SendOfferPage";
import OfferSentPage from "./pages/OfferSentPage";
import OffersPage from "./pages/OffersPage";
import SettingsPage from "./pages/SettingsPage";
import CandidateHomePage from "./pages/CandidateHomePage";
import CandidateInterviewPage from "./pages/CandidateInterviewPage";
import CandidateFeedbackPage from "./pages/CandidateFeedbackPage";
import CandidateOfferPage from "./pages/CandidateOfferPage";
import OfferAcceptedPage from "./pages/OfferAcceptedPage";
import OfferDeclinedPage from "./pages/OfferDeclinedPage";
import OnboardingPage from "./pages/OnboardingPage";

/* =========================
   AUTH POLLING
========================= */

const AUTH_POLL_INTERVAL_MS = 60000;

/* =========================
   ROUTE CONFIG
========================= */
/*
  Routes that don't require a session. "/", "/login" are handled
  separately below since they each have their own redirect logic.
*/
const PUBLIC_ROUTES = [
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-sent", element: <ResetSentPage /> },
  { path: "/change-password", element: <ChangePasswordPage /> },
  { path: "/jobs/:jobId/candidates", element: <JobCandidatesPage /> },
];

/*
  Routes that require a session; each gets wrapped in ProtectedRoute
  when rendered below.
*/
const PROTECTED_ROUTES = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/jobs", element: <JobsPage /> },
  { path: "/post-job", element: <PostJobPage /> },
  { path: "/edit-job/:jobId", element: <EditJobPage /> },
  { path: "/candidate-matcher", element: <CandidateMatcherPage /> },
  { path: "/candidates", element: <CandidatesPage /> },
  { path: "/candidate-detail/:candidateId?", element: <CandidateDetailPage /> },
  { path: "/candidates/:candidateId/edit", element: <EditCandidatePage /> },
  { path: "/upload-resume", element: <UploadResumePage /> },
  { path: "/interviews", element: <InterviewsPage /> },
  { path: "/schedule-interview", element: <ScheduleInterviewPage /> },
  { path: "/edit-interview-schedule/:interviewId", element: <EditInterviewSchedulePage /> },
  { path: "/interview-room", element: <InterviewRoomPage /> },
  { path: "/evaluations", element: <EvaluationsPage /> },
  { path: "/reject-candidate", element: <RejectCandidatePage /> },
  { path: "/reject-done", element: <RejectDonePage /> },
  { path: "/send-offer", element: <SendOfferPage /> },
  { path: "/offer-sent", element: <OfferSentPage /> },
  { path: "/offers", element: <OffersPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/candidate-home", element: <CandidateHomePage /> },
  { path: "/candidate-interview", element: <CandidateInterviewPage /> },
  { path: "/candidate-feedback", element: <CandidateFeedbackPage /> },
  { path: "/candidate-offer", element: <CandidateOfferPage /> },
  { path: "/offer-accepted", element: <OfferAcceptedPage /> },
  { path: "/offer-declined", element: <OfferDeclinedPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
];

function ProtectedRoute({ children }) {
  const session = getSession();
  const location = useLocation();

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/*
  Tracks whether a session currently exists, staying in sync with
  login/logout events and periodically refreshing the current user
  while a session is active.
*/
function useAuthSession() {
  const [hasSession, setHasSession] = useState(() => Boolean(getSession()?.token));

  useEffect(() => {
    const syncAuthState = () => {
      setHasSession(Boolean(getSession()?.token));
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

    const intervalId = window.setInterval(() => {
      if (getSession()?.token) {
        fetchCurrentUser();
      }
    }, AUTH_POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.clearInterval(intervalId);
    };
  }, []);

  return hasSession;
}

function App() {
  const hasSession = useAuthSession();

  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={hasSession ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {PUBLIC_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute>{element}</ProtectedRoute>}
            />
          ))}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;