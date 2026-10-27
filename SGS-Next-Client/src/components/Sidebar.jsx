import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Sidebar({ activeTab = 'overview', role }) {
  const { user } = useSelector(state => state.auth);

  const effectiveRole = (user?.userType || role || 'student').toLowerCase();

  const studentNav = [
    { id: 'overview', label: 'My Dashboard', link: "/auth/profile", icon: '📊' },
    { id: 'roadmap', label: 'My Roadmaps', link: "/auth/profile/my-roadmaps", icon: '⚡' },
    { id: 'messages', label: 'Messages & Chat', link: "/auth/profile/chat", icon: '💬' },
    { id: 'credits', label: 'My Credits & Wallet', link: "/auth/profile/my-credits", icon: '🪙' },
    { id: 'become_counselor', label: 'Join as Counselor', link: "/auth/profile/become-counselor", icon: '🎓' },
  ].filter(item => {
    if (item.id === 'become_counselor' && (effectiveRole === 'counselor' || effectiveRole === 'admin')) {
      return false;
    }
    return true;
  });

  const adminNav = [
    { id: 'admin_overview', label: 'System Overview', link: "/auth/admin", icon: '🛡️' },
    { id: 'admin_users', label: 'User Directory', link: "/auth/admin/users", icon: '👥' },
    { id: 'admin_categories', label: 'Categories & Tags', link: "/auth/admin/categories", icon: '🏷️' },
    { id: 'admin_approvals', label: 'Counselor Approvals', link: "/auth/admin/approvals", icon: '📝' },
    { id: 'admin_credit_requests', label: 'Credit Requests', link: "/auth/admin/credit_requests", icon: '💳' },
    { id: 'admin_ai', label: 'AI Prompt Engine', link: "/auth/admin/ai", icon: '🤖' },
  ];

  const counselorNav = [
    { id: 'counselor_overview', label: 'Counselor Workspace', link: '/auth/counselor', icon: '📈' },
    { id: 'counselor_sessions', label: 'Student Bookings', link: '/auth/counselor/bookings', icon: '📅' },
    { id: 'counselor_messages', label: 'Student Messages', link: '/auth/profile/chat', icon: '💬' },
    { id: 'counselor_earnings', label: 'Earnings & Credits', link: '/auth/counselor/earnings', icon: '💰' },
  ];

  const items = effectiveRole === 'admin'
    ? adminNav
    : effectiveRole === 'counselor'
      ? counselorNav
      : studentNav;

  const isTabActive = (item) => {
    if (activeTab === item.id) return true;
    if (item.id === 'counselor_sessions' && (activeTab === 'counselor_bookings' || activeTab === 'counselor_sessions')) return true;
    if (item.id === 'counselor_earnings' && (activeTab === 'counselor_earnings' || activeTab === 'credits' || activeTab === 'earnings')) return true;
    if (item.id === 'counselor_messages' && (activeTab === 'messages' || activeTab === 'chat' || activeTab === 'counselor_messages')) return true;
    if (item.id === 'messages' && (activeTab === 'counselor_messages' || activeTab === 'chat' || activeTab === 'messages')) return true;
    return false;
  };

  return (
    <aside className="hidden w-64 bg-parchment-card border-r-4 border-navy p-4 md:flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <nav className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg border-2 border-navy transition-all font-grotesk font-bold text-sm ${isTabActive(item)
                ? 'bg-yellow text-navy shadow-pop-sm'
                : 'bg-parchment text-navy hover:bg-parchment-dim'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

    </aside>
  );
}
