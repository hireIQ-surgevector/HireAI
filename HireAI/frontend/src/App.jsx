import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from 'react-hot-toast';

import './App.css'
import LoginPage from './pages/LoginPage';
import {
  AUTH_CHANGED_EVENT,
  fetchCurrentUser,
  getSession,
} from './utils/auth';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import JobsPage from './pages/JobsPage';
import PostJobPage from './pages/PostJobPage';
import EditJobPage from './pages/EditJobPage';
import JobCandidatesPage from './pages/JobCandidatesPage';
import CandidateMatcherPage from "./pages/CandidateMatcherPage";
import ResetSentPage from './pages/ResetSentPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import CandidatesPage from './pages/CandidatesPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import EditCandidatePage from './pages/EditCandidatePage';
import UploadResumePage from './pages/UploadResumePage';
import InterviewsPage from './pages/InterviewsPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ScheduleInterviewPage from './pages/ScheduleInterviewPage';
import EditInterviewSchedulePage from './pages/EditInterviewSchedulePage';
import EvaluationsPage from './pages/EvaluationsPage';
import RejectCandidatePage from './pages/RejectCandidatePage';
import RejectDonePage from './pages/RejectDonePage';
import SendOfferPage from './pages/SendOfferPage';
import OfferSentPage from './pages/OfferSentPage';
import OffersPage from './pages/OffersPage';
import SettingsPage from './pages/SettingsPage';
import CandidateHomePage from './pages/CandidateHomePage';
import CandidateInterviewPage from './pages/CandidateInterviewPage';
import CandidateFeedbackPage from './pages/CandidateFeedbackPage';
import CandidateOfferPage from './pages/CandidateOfferPage';
import OfferAcceptedPage from './pages/OfferAcceptedPage';
import OfferDeclinedPage from './pages/OfferDeclinedPage';
import OnboardingPage from './pages/OnboardingPage';


function ProtectedRoute({ children }) {
  const session = getSession();
  const location = useLocation();

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
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
    }, 60000);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={hasSession ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-sent" element={<ResetSentPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><PostJobPage /></ProtectedRoute>} />
          <Route path="/edit-job/:jobId" element={<ProtectedRoute><EditJobPage /></ProtectedRoute>} />
          <Route path="/jobs/:jobId/candidates" element={<JobCandidatesPage />} />
          <Route path="/candidate-matcher" element={<ProtectedRoute><CandidateMatcherPage /></ProtectedRoute>} />
          <Route path="/candidates" element={<ProtectedRoute><CandidatesPage /></ProtectedRoute>} />
          <Route path="/candidate-detail/:candidateId?" element={<ProtectedRoute><CandidateDetailPage /></ProtectedRoute>} />
          <Route path="/candidates/:candidateId/edit" element={<ProtectedRoute><EditCandidatePage /></ProtectedRoute>} />
          <Route path="/upload-resume" element={<ProtectedRoute><UploadResumePage /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
          <Route path="/schedule-interview" element={<ProtectedRoute><ScheduleInterviewPage /></ProtectedRoute>} />
          <Route path="/edit-interview-schedule/:interviewId" element={<ProtectedRoute><EditInterviewSchedulePage /></ProtectedRoute>} />
          <Route path="/interview-room" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
          <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />
          <Route path="/reject-candidate" element={<ProtectedRoute><RejectCandidatePage /></ProtectedRoute>} />
          <Route path="/reject-done" element={<ProtectedRoute><RejectDonePage /></ProtectedRoute>} />
          <Route path="/send-offer" element={<ProtectedRoute><SendOfferPage /></ProtectedRoute>} />
          <Route path="/offer-sent" element={<ProtectedRoute><OfferSentPage /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><OffersPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/candidate-home" element={<ProtectedRoute><CandidateHomePage /></ProtectedRoute>} />
          <Route path="/candidate-interview" element={<ProtectedRoute><CandidateInterviewPage /></ProtectedRoute>} />
          <Route path="/candidate-feedback" element={<ProtectedRoute><CandidateFeedbackPage /></ProtectedRoute>} />
          <Route path="/candidate-offer" element={<ProtectedRoute><CandidateOfferPage /></ProtectedRoute>} />
          <Route path="/offer-accepted" element={<ProtectedRoute><OfferAcceptedPage /></ProtectedRoute>} />
          <Route path="/offer-declined" element={<ProtectedRoute><OfferDeclinedPage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
