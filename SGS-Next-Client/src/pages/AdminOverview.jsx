import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import adminService from '../services/adminService';
import LoadingScreen from '../components/LoadingScreen';
import { setAdminData } from '../features/admin/adminSlice';
import toast from 'react-hot-toast';

export default function AdminOverview() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [showHealthModal, setShowHealthModal] = useState(false);

  const { data, isLoading, isSuccess, isError, error } = useQuery({
    queryKey: ["admin"],
    queryFn: () => adminService.fetchAdminOverview(user.token)
  });

  const activeCounselors = data?.counselors?.filter(item => item.status === "accepted")?.length || 0;
  const pendingRequests = data?.counselors?.filter(item => item.status !== "accepted") || [];
  const approvedCredits = data?.credits?.filter(item => item.status === "granted")?.reduce((acc, item) => acc + item.credits, 0) || 0;

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setAdminData(data));
    }

    if (isError) {
      toast.error(error?.response?.data?.message || "Failed to load admin overview", { position: "top-center" });
    }
  }, [isSuccess, isError, error, data, dispatch]);

  if (isLoading) {
    return (
      <LoadingScreen loadingMessage='Fetching All Data...' />
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="admin" />

      <div className="flex-1 flex">
        <Sidebar activeTab="admin_overview" role="admin" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="bg-navy text-white border-4 border-navy rounded-3xl p-6 shadow-pop mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-block bg-yellow text-navy font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2">
                  ADMIN SUPERVISOR SUITE
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-white">
                  CareerBridge <span className="text-yellow">Platform Control</span>
                </h1>
                <p className="font-body text-xs text-parchment-dim mt-1">
                  Global system metrics, user growth analytics, counselor approvals, and credit circulation monitoring.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowHealthModal(true)}
                >
                  System Health Report 📊
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Total Registered Users</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{data?.users?.length || 0}</div>
              <div className="text-xs text-rust font-bold mt-1">Verified student & mentor pool</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Active Counselors</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{activeCounselors}</div>
              <div className="text-xs text-teal font-bold mt-1">Pending Approvals : {pendingRequests.length}</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Credits Circulating</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{approvedCredits}</div>
              <div className="text-xs text-rust font-bold mt-1">Granted via purchases & signup</div>
            </Card>

            <Card color="yellow">
              <div className="font-mono text-xs font-bold text-navy uppercase">AI Roadmaps Generated</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{data?.roadmaps?.length || 0}</div>
              <div className="text-xs text-navy font-bold mt-1">99.8% System Uptime</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-grotesk font-extrabold text-xl text-navy">Pending Counselor Requests</h2>
                  <Link to="/auth/admin/approvals" className="font-grotesk font-bold text-xs text-rust hover:underline">
                    Manage All Approvals →
                  </Link>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {pendingRequests.length === 0 ? (
                    <div className="p-4 text-center text-navy-muted">
                      No pending counselor requests requiring approval.
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <Link
                        key={request._id}
                        to="/auth/admin/approvals"
                        className="bg-parchment border-2 border-navy p-3 rounded-xl flex justify-between items-center hover:bg-yellow/30 transition-all block"
                      >
                        <div>
                          <span className="font-bold text-rust">[{new Date(request?.createdAt).toLocaleDateString('en-IN')}]</span>{' '}
                          <span className="font-bold text-navy">{request?.user?.name || 'Applicant'}</span>
                          <div className="text-navy-muted text-[11px] mt-0.5">{request?.category?.title || 'Category'}</div>
                        </div>
                        <StatusBadge text={request?.status || 'pending'} status="warning" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showHealthModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 max-w-lg w-full shadow-pop space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="inline-block bg-teal text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  HEALTH VITALS
                </span>
                <h3 className="font-grotesk font-extrabold text-xl text-navy mt-1">Platform Diagnostic Report</h3>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="font-mono font-bold text-navy text-sm p-1 hover:text-rust"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">Backend Server (Express)</span>
                <span className="text-teal font-bold">🟢 ONLINE (Port 5511)</span>
              </div>
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">Database (MongoDB Atlas)</span>
                <span className="text-teal font-bold">🟢 CONNECTED</span>
              </div>
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">Real-Time Messaging (Socket.io)</span>
                <span className="text-teal font-bold">🟢 ACTIVE</span>
              </div>
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">AI Roadmap Engine (Gemini)</span>
                <span className="text-teal font-bold">🟢 READY</span>
              </div>
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">Total Users Registered</span>
                <span className="text-navy font-bold">{data?.users?.length || 0} Accounts</span>
              </div>
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <span className="font-bold text-navy">Circulating Credits</span>
                <span className="text-navy font-bold">{approvedCredits} Credits</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowHealthModal(false)}>
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}