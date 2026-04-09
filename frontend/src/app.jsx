import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Navbar from "./component/Navbar";

import PostProject from "./pages/PostProject";
import ManageProject from "./pages/ManageProject";
import Applicants from "./pages/Applicants";
import MyProposals from "./pages/MyProposals";
import BrowseProjects from "./pages/BrowseProjects";
import ApplyProposal from "./pages/ApplyProposal";
import Payments from "./pages/Payments";
import EscrowDetails from "./pages/EscrowDetails";
import SubmitWork from "./pages/SubmitWork";
import EscrowManagement from "./pages/EscrowManagement";
import Esewapaymentform from "./pages/Esewapaymentform";
import PaymentFailure from "./pages/Paymentfailure";
import PaymentSuccess from "./pages/PaymentSucess";
import SMEReviewWork from "./pages/SMEReviewWork";
import RaiseDispute from "./pages/RaiseDispute";
import ResolveDispute from "./pages/ResolveDispute";
import DisputeList from "./pages/DisputeList";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";

// Chat
import MessageBubble from "./pages/Chat/MessageBubble";
import ChatPage from "./pages/Chat/ChatPage";

// Reviews
import SubmitReview from "./pages/SubmitReview";
import MyReviews from "./pages/MyReviews";

// Analytics
import ProposalAnalytics from "./pages/ProposalAnalytics";

// Matchmaking
import MatchedFreelancers from "./pages/MatchedFreelancers";

// Global Search
import GlobalSearch from "./pages/GlobalSearch";

// ── NEW ──────────────────────────────────────────────────

import ProfileSetup from "./pages/ProfileSetup";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const location = useLocation();
  const hideNavbar =
    location.pathname.startsWith("/dashboard") ||
    location.pathname === "/profile-setup" 
    

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* ── Public ── */}
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/profile/:userId" element={<PublicProfile />} />

       

        {/* ── Profile setup (after first login) ── */}
        <Route path="/profile-setup" element={
          <ProtectedRoute><ProfileSetup /></ProtectedRoute>
        } />

        {/* ── Payments ── */}
        <Route path="/payment/esewa"   element={<ProtectedRoute><Esewapaymentform /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/payment/failure" element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<Profile />} />
          <Route path="profile" element={<Profile />} />

          {/* Freelancer */}
          <Route path="browse-projects"        element={<BrowseProjects />} />
          <Route path="apply/:projectId"        element={<ApplyProposal />} />
          <Route path="my-proposals"            element={<MyProposals />} />
          <Route path="proposal-analytics"      element={<ProposalAnalytics />} />
          <Route path="submit-work/:proposalId" element={<SubmitWork />} />

          {/* Global Search */}
          <Route path="search"                   element={<GlobalSearch />} />

          {/* SME */}
          <Route path="post-project"    element={<PostProject />} />
          <Route path="manage-projects" element={<ManageProject />} />
          <Route path="applicants"      element={<Applicants />} />
          <Route path="matched-freelancers/:projectId" element={<MatchedFreelancers />} />

          {/* Chat */}
          <Route path="messages"          element={<MessageBubble />} />
          <Route path="chat/:projectId"   element={<ChatPage />} />

          {/* Reviews */}
          <Route path="submit-review/:escrowId" element={<SubmitReview />} />
          <Route path="my-reviews"              element={<MyReviews />} />

          {/* Shared */}
          <Route path="payments"                  element={<Payments />} />
          <Route path="escrow/:escrowId"           element={<EscrowDetails />} />
          <Route path="escrow-management"          element={<EscrowManagement />} />
          <Route path="review-work/:escrowId"      element={<SMEReviewWork />} />
          <Route path="raise-dispute/:escrowId"    element={<RaiseDispute />} />
          <Route path="disputes"                   element={<DisputeList />} />
          <Route path="resolve-dispute/:escrowId"  element={<ResolveDispute />} />
          <Route path="notifications"              element={<Notifications />} />
          <Route path="admin"                      element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
