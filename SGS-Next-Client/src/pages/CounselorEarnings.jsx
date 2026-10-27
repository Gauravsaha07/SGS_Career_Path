import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import LoadingScreen from '../components/LoadingScreen';
import counselorService from '../services/counselorService';

export default function CounselorEarnings() {
  const { user } = useSelector((state) => state.auth);

  const userRole = (user?.userType || '').toUpperCase();
  if (userRole === 'STUDENT') {
    return <Navigate to="/auth/profile" replace />;
  }
  if (userRole === 'ADMIN') {
    return <Navigate to="/auth/admin" replace />;
  }

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['counselorWorkspace', user?._id],
    queryFn: () => counselorService.fetchMyWorkspace(user.token),
    enabled: !!user?.token
  });

  const handleRequestPayout = () => {
    toast.success("Payout request submitted! Automatic disbursements process on the 1st and 15th.");
  };

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Counselor Earnings & Credits..." />;
  }

  const bookingsList = workspace?.bookings || [];
  const totalCalls = workspace?.totalCalls ?? bookingsList.length;
  const creditsEarned = workspace?.creditsEarned ?? 0;
  const earningsINR = workspace?.earningsINR ?? (creditsEarned * 10);
  const walletCredits = workspace?.walletCredits ?? user?.credits ?? 0;
  const avgRating = workspace?.avgRating || "5.0";

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="dashboard" />

      <div className="flex-1 flex">
        <Sidebar activeTab="counselor_earnings" role="counselor" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-block bg-navy text-yellow font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2">
                  Counselor Finance & Credits
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-navy">
                  Earnings & Credits Ledger 💰
                </h1>
                <p className="font-body text-xs text-navy-muted mt-1">
                  Track your mentorship session revenue, credit conversions, and upcoming bank disbursements.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="accent" size="md" onClick={handleRequestPayout}>
                  Request Payout
                </Button>
                <Link to="/auth/counselor">
                  <Button variant="outline" size="md">
                    &larr; Workspace
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Sessions Completed</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{totalCalls} Calls</div>
              <div className="text-xs text-rust font-bold mt-1">★ {avgRating} Rating Average</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Session Credits Earned</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{creditsEarned} pts</div>
              <div className="text-xs text-rust font-bold mt-1">50 Credits / Session Rate</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Total Earnings (INR)</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">
                ₹{earningsINR.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-teal font-bold mt-1">1 Credit = ₹10 INR Conversion</div>
            </Card>

            <Card color="yellow">
              <div className="font-mono text-xs font-bold text-navy uppercase">Wallet Balance</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{walletCredits} pts</div>
              <div className="text-xs text-navy font-bold mt-1">Available in Account</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-grotesk font-extrabold text-xl text-navy">Session Earnings Breakdown</h2>
                  <span className="font-mono text-xs text-navy-muted font-bold">
                    {bookingsList.length} Sessions Logged
                  </span>
                </div>

                {bookingsList.length === 0 ? (
                  <div className="bg-parchment border-2 border-dashed border-navy/40 p-12 rounded-2xl text-center">
                    <span className="text-4xl mb-3 block">🪙</span>
                    <p className="font-grotesk font-bold text-base text-navy">No session earnings yet</p>
                    <p className="font-body text-xs text-navy-muted mt-1 max-w-md mx-auto">
                      When students book and complete 1-on-1 mentorship sessions with you, your session credit earnings and INR payouts will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookingsList.map((b, idx) => {
                      const studentName = b.studentName || b.student?.name || 'Student Mentee';
                      const feeCredits = b.fee || 50;
                      const feeINR = feeCredits * 10;
                      const dateStr = b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recent';

                      return (
                        <div
                          key={b._id || idx}
                          className="bg-parchment border-2 border-navy p-4 rounded-xl flex items-center justify-between shadow-pop-sm"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-grotesk font-extrabold text-sm text-navy">{studentName}</span>
                              <StatusBadge text={b.status === 'confirmed' ? 'EARNED' : 'PENDING'} status={b.status === 'confirmed' ? 'success' : 'info'} />
                            </div>
                            <p className="font-body text-xs text-navy-muted mt-0.5">
                              {b.topic || '1-on-1 Mentorship'} • {b.slot || 'Scheduled Slot'} • {dateStr}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="font-grotesk font-extrabold text-base text-teal">
                              +{feeCredits} pts
                            </div>
                            <div className="font-mono text-xs text-navy font-bold">
                              ₹{feeINR.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h3 className="font-grotesk font-extrabold text-lg text-navy mb-4">Payout Schedule & Terms</h3>
                <div className="space-y-4 font-body text-xs">
                  <div className="bg-parchment p-3 rounded-xl border border-navy space-y-1">
                    <div className="font-mono text-[10px] text-navy-muted uppercase font-bold">Conversion Rate</div>
                    <div className="font-grotesk font-extrabold text-sm text-navy">1 Credit = ₹10.00 INR</div>
                    <p className="text-navy-muted">Every 50-credit call equals ₹500 in take-home pay.</p>
                  </div>

                  <div className="bg-parchment p-3 rounded-xl border border-navy space-y-1">
                    <div className="font-mono text-[10px] text-navy-muted uppercase font-bold">Disbursement Frequency</div>
                    <div className="font-grotesk font-extrabold text-sm text-navy">1st & 15th of Every Month</div>
                    <p className="text-navy-muted">Automated direct IMPS/NEFT transfers to your bank account.</p>
                  </div>

                  <div className="bg-parchment p-3 rounded-xl border border-navy space-y-1">
                    <div className="font-mono text-[10px] text-navy-muted uppercase font-bold">Payout Status</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-grotesk font-bold text-navy">Verified Indian Bank Account</span>
                      <StatusBadge text="VERIFIED" status="success" />
                    </div>
                  </div>

                  <Button variant="sky" size="sm" className="w-full" onClick={handleRequestPayout}>
                    Submit Payout Inquiry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
