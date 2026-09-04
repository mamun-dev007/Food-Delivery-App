import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex min-h-screen bg-base-200">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(true)} search={search} onSearch={setSearch} />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <Outlet context={{ search }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;