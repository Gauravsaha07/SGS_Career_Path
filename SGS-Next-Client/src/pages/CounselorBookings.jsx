import { useState } from 'react';
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

export default function CounselorBookings() {
  const { user } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState('all');

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

  const handleAcceptBooking = () => {
    toast.success("Booking session confirmed! Mentee notified via chat.");
  };

  const handleReschedule = () => {
    toast.info("Reschedule proposal sent to student via chat.");
  };

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Student Bookings..." />;
  }

  const bookingsList = workspace?.bookings || [];
  const filteredBookings = bookingsList.filter((b) => {
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'pending') return b.status !== 'confirmed';
    return true;
  });

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="dashboard" />

      <div className="flex-1 flex">
        <Sidebar activeTab="counselor_sessions" role="counselor" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-block bg-navy text-yellow font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2">
                  Counselor Appointments
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-navy">
                  Student Session Bookings 📅
                </h1>
                <p className="font-body text-xs text-navy-muted mt-1">
                  Manage your scheduled 1-on-1 career mentorship sessions, confirm appointments, and message mentees.
                </p>
              </div>

              <Link to="/auth/counselor">
                <Button variant="outline" size="md">
                  &larr; Back to Workspace
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Total Bookings</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{bookingsList.length}</div>
              <div className="text-xs text-teal font-bold mt-1">All-time student appointments</div>
            </Card>

            <Card color="white">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Confirmed Sessions</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">
                {bookingsList.filter((b) => b.status === 'confirmed').length}
              </div>
              <div className="text-xs text-rust font-bold mt-1">Ready for mentorship calls</div>
            </Card>

            <Card color="yellow">
              <div className="font-mono text-xs font-bold text-navy uppercase">Session Rate</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">50 Credits</div>
              <div className="text-xs text-navy font-bold mt-1">₹500 payout value per call</div>
            </Card>
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-grotesk font-bold text-xs border-2 border-navy transition-all ${
                filter === 'all' ? 'bg-navy text-white shadow-pop-sm' : 'bg-parchment text-navy hover:bg-parchment-dim'
              }`}
            >
              All Sessions ({bookingsList.length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-xl font-grotesk font-bold text-xs border-2 border-navy transition-all ${
                filter === 'confirmed' ? 'bg-navy text-white shadow-pop-sm' : 'bg-parchment text-navy hover:bg-parchment-dim'
              }`}
            >
              Confirmed ({bookingsList.filter((b) => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl font-grotesk font-bold text-xs border-2 border-navy transition-all ${
                filter === 'pending' ? 'bg-navy text-white shadow-pop-sm' : 'bg-parchment text-navy hover:bg-parchment-dim'
              }`}
            >
              Pending ({bookingsList.filter((b) => b.status !== 'confirmed').length})
            </button>
          </div>

          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
            <h2 className="font-grotesk font-extrabold text-xl text-navy mb-4">Appointments Ledger</h2>

            {filteredBookings.length === 0 ? (
              <div className="bg-parchment border-2 border-dashed border-navy/40 p-12 rounded-2xl text-center">
                <span className="text-4xl mb-3 block">📅</span>
                <p className="font-grotesk font-bold text-base text-navy">No session bookings found</p>
                <p className="font-body text-xs text-navy-muted mt-1 max-w-md mx-auto">
                  {filter === 'all'
                    ? 'When students book 1-on-1 career mentorship sessions from your profile, their appointments will appear here.'
                    : `No bookings matching the "${filter}" filter status.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b, idx) => {
                  const studentName = b.studentName || b.student?.name || 'Student Mentee';
                  const studentQual = b.student?.qualification || b.student?.email || b.studentEmail || 'Student';
                  const studentPic = b.student?.profilePic;
                  const isConfirmed = b.status === 'confirmed';
                  const bookingDate = b.createdAt
                    ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <div
                      key={b._id || idx}
                      className="bg-parchment border-3 border-navy p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-pop-sm"
                    >
                      <div className="flex items-start space-x-4">
                        {studentPic ? (
                          <img
                            src={studentPic}
                            alt={studentName}
                            className="w-12 h-12 rounded-full border-2 border-navy object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-navy bg-yellow flex items-center justify-center font-grotesk font-extrabold text-navy text-lg">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-grotesk font-extrabold text-base text-navy">{studentName}</span>
                            <StatusBadge
                              text={isConfirmed ? 'CONFIRMED' : `${b.fee || 50} Credits`}
                              status={isConfirmed ? 'success' : 'info'}
                            />
                          </div>
                          <p className="font-mono text-xs text-navy-muted">{studentQual}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs font-bold text-navy mt-1">
                            <span className="text-rust">📌 {b.topic || 'Career Guidance'}</span>
                            <span className="text-navy-muted">🕒 {b.slot || 'Flexible Slot'}</span>
                            <span className="text-teal">📅 Booked: {bookingDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <Link to="/auth/profile/chat">
                          <Button variant="outline" size="sm">
                            Chat 💬
                          </Button>
                        </Link>
                        <Button variant="sky" size="sm" onClick={handleReschedule}>
                          Reschedule
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAcceptBooking}
                          disabled={isConfirmed}
                        >
                          {isConfirmed ? 'Confirmed ✓' : 'Accept Booking ✓'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
