import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumb from './Breadcrumb';
import { useUIStore } from '../../stores/uiStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area sidebar-permanent" style={{ paddingLeft: collapsed ? '60px' : undefined }}>
        <TopBar />
        <main className="content-area">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
