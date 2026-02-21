import { Outlet } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import "./Dashboard.css";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user")); // stored at login

  return (
    <div className="dashboard-container">
      <Sidebar role={user?.role} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
