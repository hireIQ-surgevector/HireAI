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
import LoginPage from './components/LoginPage';
import {
  AUTH_CHANGED_EVENT,
  fetchCurrentUser,
  getSession,
} from './utils/auth';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import JobsPage from './components/JobsPage';
import PostJobPage from './components/PostJobPage';
import EditJobPage from './components/EditJobPage';
import JobCandidatesPage from './components/JobCandidatesPage';
import CandidateMatcherPage from "./components/CandidateMatcherPage";
import ResetSentPage from './components/ResetSentPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import DashboardPage from './components/DashboardPage';
import CandidatesPage from './components/CandidatesPage';
import CandidateDetailPage from './components/CandidateDetailPage';
import EditCandidatePage from './components/EditCandidatePage';
import UploadResumePage from './components/UploadResumePage';
import InterviewsPage from './components/InterviewsPage';
import InterviewRoomPage from './components/InterviewRoomPage';
import ScheduleInterviewPage from './components/ScheduleInterviewPage';
import EvaluationsPage from './components/EvaluationsPage';
import RejectCandidatePage from './components/RejectCandidatePage';
import RejectDonePage from './components/RejectDonePage';
import SendOfferPage from './components/SendOfferPage';
import OfferSentPage from './components/OfferSentPage';
import OffersPage from './components/OffersPage';
import SettingsPage from './components/SettingsPage';
import CandidateHomePage from './components/CandidateHomePage';
import CandidateInterviewPage from './components/CandidateInterviewPage';
import CandidateFeedbackPage from './components/CandidateFeedbackPage';
import CandidateOfferPage from './components/CandidateOfferPage';
import OfferAcceptedPage from './components/OfferAcceptedPage';
import OfferDeclinedPage from './components/OfferDeclinedPage';
import OnboardingPage from './components/OnboardingPage';


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
