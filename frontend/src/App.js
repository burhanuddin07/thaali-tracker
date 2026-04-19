import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { LayoutDashboard, ListChecks, Upload, Building2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import UploadPage from "./pages/UploadPage";
import CentreView from "./pages/CentreView";

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

const PAGES = [
  { id: "dashboard", label: "Dashboard",   shortLabel: "Home",    icon: LayoutDashboard },
  { id: "centres",   label: "Centre View", shortLabel: "Centres", icon: Building2 },
  { id: "records",   label: "All Records", shortLabel: "Records", icon: ListChecks },
  { id: "upload",    label: "Upload Excel",shortLabel: "Upload",  icon: Upload },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const renderPage = () => {
    if (page === "dashboard") return <Dashboard />;
    if (page === "centres")   return <CentreView />;
    if (page === "records")   return <Records />;
    if (page === "upload")    return <UploadPage onSuccess={() => setPage("dashboard")} />;
    return null;
  };
  return (
    <QueryClientProvider client={qc}>
      <Toaster position="top-center" toastOptions={{ style: { background: "#1e2335", color: "#e8eaf6", border: "1px solid #2a3050", fontSize: 13 }, duration: 2200 }} />
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Thaali Tracker</h1>
            <p>Sticker Management</p>
          </div>
          <nav className="sidebar-nav">
            {PAGES.map(({ id, label, shortLabel, icon: Icon }) => (
              <button key={id} className={`nav-item${page === id ? " active" : ""}`} onClick={() => setPage(id)}>
                <Icon size={20} />
                <span className="nav-label">{label}</span>
                <span className="nav-short">{shortLabel}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="main">{renderPage()}</main>
      </div>
    </QueryClientProvider>
  );
}