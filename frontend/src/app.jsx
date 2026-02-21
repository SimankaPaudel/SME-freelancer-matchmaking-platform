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

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/dashboard");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* eSewa payment */}
        <Route path="/payment/esewa" element={<ProtectedRoute><Esewapaymentform /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/payment/failure" element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} />

        {/* Dashboard */}
        <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<Profile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-proposals" element={<MyProposals />} />
          <Route path="browse-projects" element={<BrowseProjects />} />
          <Route path="apply/:projectId" element={<ApplyProposal />} />
          <Route path="post-project" element={<PostProject />} />
          <Route path="manage-projects" element={<ManageProject />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="submit-work/:proposalId" element={<SubmitWork />} />
          <Route path="payments" element={<Payments />} />
          <Route path="escrow/:escrowId" element={<EscrowDetails />} />
          <Route path="escrow-management" element={<EscrowManagement />} />
          <Route path="review-work/:escrowId" element={<SMEReviewWork />} />
          <Route path="raise-dispute/:escrowId" element={<RaiseDispute />} />
          <Route path="disputes" element={<DisputeList />} />
          <Route path="resolve-dispute/:escrowId" element={<ResolveDispute />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// ✅ FIXED: export default (not named export)
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

