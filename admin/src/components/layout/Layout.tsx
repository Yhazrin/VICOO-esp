import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumb from './Breadcrumb';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area sidebar-permanent">
        <TopBar />
        <main className="content-area">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
