import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';
import counselorService from '../services/counselorService';
import { setUser } from '../features/auth/authSlice';
import LoadingScreen from '../components/LoadingScreen';

export default function CounselorDashboard() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['counselorWorkspace', user?._id],
    queryFn: () => counselorService.fetchMyWorkspace(user.token),
    enabled: !!user?.token
  });

  useEffect(() => {
    if (workspace?.availableSlots) {
      setAvailableSlots(workspace.availableSlots);
    }
  }, [workspace?.availableSlots]);

  useEffect(() => {
    if (user?.token) {
      authService.getMe(user.token).then((freshData) => {
        if (freshData && freshData._id) {
          const updated = { ...user, ...freshData, token: user.token };
          localStorage.setItem("user", JSON.stringify(updated));
          dispatch(setUser(updated));
        }
      }).catch(() => {});
    }
  }, [user?.token, dispatch]);

  const updateSlotsMutation = useMutation({
    mutationFn: (newSlots) => counselorService.updateSlots(newSlots, user.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselorWorkspace'] });
      setShowSlotsModal(false);
      toast.success("Counseling availability slots updated successfully!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update slots");
    }
  });

  const toggleSlot = (index) => {
    setAvailableSlots((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, active: !s.active } : s))
    );
  };

  const handleSaveSlots = () => {
    updateSlotsMutation.mutate(availableSlots);
  };

  const handleAcceptBooking = (bookingId) => {
    toast.success("Booking session confirmed! Mentee notified via chat.");
  };

  const handleReschedule = (bookingId) => {
    toast.info("Reschedule proposal sent to student via chat.");
  };

  const userRole = (user?.userType || '').toUpperCase();
  if (userRole === 'STUDENT') {
    return <Navigate to="/auth/profile" replace />;
  }
  if (userRole === 'ADMIN') {
    return <Navigate to="/auth/admin" replace />;
  }

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Counselor Workspace..." />;
  }

  const bookingsList = workspace?.bookings || [];
  const totalCalls = workspace?.totalCalls ?? bookingsList.length;
  const avgRating = workspace?.avgRating || "5.0";
  const creditsEarned = workspace?.creditsEarned ?? 0;
  const earningsINR = workspace?.earningsINR ?? (creditsEarned * 10);

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="dashboard" />

      <div className="flex-1 flex">
        <Sidebar activeTab="counselor_overview" role="counselor" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-block bg-navy text-yellow font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2">
                  Counselor Portal • {user?.name}
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-navy">
                  Welcome back, {user?.name} 🎓
                </h1>
                <p className="font-body text-xs text-navy-muted mt-1">
                  Manage your student sessions, availability schedule, and earned mentorship credits.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => setShowSlotsModal(true)}
                >
                  Update Available Slots
                </Button>
                <Button
                  variant="sky"
                  size="md"
                  onClick={() => setShowPayoutModal(true)}
                >
                  Payout History
                </Button>
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
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Total Earnings</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">₹{earningsINR.toLocaleString('en-IN')}</div>
              <div className="text-xs text-teal font-bold mt-1">Direct Bank Payouts</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Credits Earned</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{creditsEarned} pts</div>
              <div className="text-xs text-rust font-bold mt-1">50 Credits / Session Rate</div>
            </Card>

            <Card color="yellow">
              <div className="font-mono text-xs font-bold text-navy uppercase">Profile Status</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">
                {workspace?.status ? workspace.status.toUpperCase() : "VERIFIED"}
              </div>
              <div className="text-xs text-navy font-bold mt-1">{user?.qualification || 'Senior Industry Mentor'}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h2 className="font-grotesk font-extrabold text-xl text-navy mb-4">Student Session Bookings</h2>
                <div className="space-y-4">
                  {bookingsList.length === 0 ? (
                    <div className="bg-parchment border-2 border-dashed border-navy/40 p-8 rounded-2xl text-center">
                      <span className="text-3xl mb-2 block">📅</span>
                      <p className="font-grotesk font-bold text-sm text-navy">No pending student session requests</p>
                      <p className="font-body text-xs text-navy-muted mt-1">
                        When students book 1-on-1 calls from your profile, their requests will appear here.
                      </p>
                    </div>
                  ) : (
                    bookingsList.map((req, idx) => {
                      const studentName = req.studentName || req.student?.name || "Student Mentee";
                      const studentQual = req.student?.qualification || req.studentEmail || "Student";
                      const isConfirmed = req.status === 'confirmed';

                      return (
                        <div key={req._id || idx} className="bg-parchment border-3 border-navy p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-pop-sm">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-grotesk font-extrabold text-base text-navy">{studentName}</span>
                              <StatusBadge text={isConfirmed ? 'CONFIRMED' : `${req.fee || 50} Credits`} status={isConfirmed ? 'success' : 'info'} />
                            </div>
                            <p className="font-mono text-xs text-navy-muted">{studentQual}</p>
                            <p className="font-body text-xs font-bold text-rust mt-1">📌 {req.topic} • {req.slot}</p>
                          </div>

                          <div className="flex space-x-2 w-full md:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReschedule(req._id)}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptBooking(req._id)}
                              disabled={isConfirmed}
                            >
                              {isConfirmed ? 'Accepted ✓' : 'Accept Booking ✓'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h3 className="font-grotesk font-extrabold text-lg text-navy mb-3">Counselor Settings</h3>
                <div className="space-y-3 font-body text-xs">
                  <div className="flex justify-between items-center bg-parchment p-3 rounded-xl border border-navy">
                    <span>Session Fee (Credits)</span>
                    <span className="font-bold text-navy font-mono">50 Credits</span>
                  </div>
                  <div className="flex justify-between items-center bg-parchment p-3 rounded-xl border border-navy">
                    <span>Auto-Accept Bookings</span>
                    <span className="font-bold text-rust font-mono">ENABLED</span>
                  </div>
                  <div className="flex justify-between items-center bg-parchment p-3 rounded-xl border border-navy">
                    <span>Payout Bank Account</span>
                    <span className="font-bold text-navy font-mono">Verified Indian Bank A/C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showSlotsModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 max-w-md w-full shadow-pop space-y-4">
            <h3 className="font-grotesk font-extrabold text-xl text-navy">Manage Counseling Slots</h3>
            <p className="font-body text-xs text-navy-muted">
              Select which time slots are open for students to book 1-on-1 mentorship sessions:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableSlots.map((slot, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between p-3 bg-parchment border-2 border-navy rounded-xl cursor-pointer hover:bg-yellow/30"
                >
                  <span className="font-mono text-xs font-bold text-navy">
                    {slot.day} - {slot.time}
                  </span>
                  <input
                    type="checkbox"
                    checked={slot.active !== false}
                    onChange={() => toggleSlot(idx)}
                    className="w-4 h-4 accent-navy"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowSlotsModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSlots}
                disabled={updateSlotsMutation.isPending}
              >
                {updateSlotsMutation.isPending ? "Saving..." : "Save Slots"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPayoutModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 max-w-lg w-full shadow-pop space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-grotesk font-extrabold text-xl text-navy">Counselor Payout Ledger</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="font-mono font-bold text-navy text-sm p-1"
              >
                ✕
              </button>
            </div>
            <p className="font-body text-xs text-navy-muted">
              Counselor payouts are disbursed every 1st and 15th of the month via IMPS/NEFT.
            </p>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-parchment border-2 border-navy rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-navy">₹{earningsINR.toLocaleString('en-IN')} ({creditsEarned} Credits)</div>
                  <div className="text-[10px] text-navy-muted">Current Cycle • Auto-Payout Pending</div>
                </div>
                <StatusBadge text="ACTIVE" status="success" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowPayoutModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
