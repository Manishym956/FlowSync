import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#111319]">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Fixed top nav (positioned after sidebar) */}
      <TopNav />

      {/* Main content — offset by sidebar width + topnav height */}
      <main
        className="ml-[240px] mt-14 min-h-[calc(100vh-56px)] p-6"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
