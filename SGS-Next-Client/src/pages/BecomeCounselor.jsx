import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import counselorService from '../services/counselorService';
import LoadingScreen from '../components/LoadingScreen';
import CounselorApplicationForm from '../components/CounselorApplicationForm';
import { Navigate, Link } from 'react-router-dom';

export default function BecomeCounselor() {
  const { user } = useSelector(state => state.auth);

  const effectiveRole = (user?.userType || '').toLowerCase();

  // Redirect users who are already counselors or admins
  if (effectiveRole === 'counselor') {
    return <Navigate to="/auth/counselor" replace />;
  }
  if (effectiveRole === 'admin') {
    return <Navigate to="/auth/admin" replace />;
  }

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["category"],
    queryFn: () => authService.fetchQueries()
  });

  const { data: application, isLoading: loadingApp } = useQuery({
    queryKey: ["my-counselor-application", user?._id],
    queryFn: () => counselorService.fetchMyApplication(user?.token),
    enabled: !!user?.token
  });

  if (loadingCategories || loadingApp) {
    return <LoadingScreen loadingMessage='Checking Application Status...' />;
  }

  const isPending = application && application.status === 'pending';
  const isAccepted = application && application.status === 'accepted';

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="counselors" />

      <div className="flex-1 flex">
        <Sidebar activeTab="become_counselor" role={effectiveRole || 'student'} />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          {/* Header */}
          <div className="mb-8 max-w-3xl">
            <div className="inline-block bg-yellow border-3 border-navy px-3 py-1 rounded-full shadow-pop-sm font-mono text-xs font-bold text-navy mb-2">
              COUNSELOR PARTNER PROGRAM
            </div>
            <h1 className="font-grotesk font-extrabold text-3xl text-navy">
              Become a <span className="text-rust">Verified Mentor</span> on CareerBridge
            </h1>
            <p className="font-body text-sm text-navy-muted mt-1">
              Share your industry expertise, guide aspiring Indian students, and earn guaranteed credit payouts in INR.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Application Form or Status View */}
            <div className="lg:col-span-2">
              {isAccepted ? (
                <div className="bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop relative">
                  <div className="text-center mb-6 pb-6 border-b-2 border-navy/20">
                    <StatusBadge text="APPLICATION APPROVED" status="success" />
                    <h2 className="font-grotesk font-extrabold text-2xl text-navy mt-3">Welcome to the Counselor Team!</h2>
                    <p className="font-body text-sm text-navy-muted mt-2">
                      Your counselor application has been verified and approved by the CareerBridge Admin team.
                    </p>
                  </div>
                  <div className="text-center">
                    <Link to="/auth/counselor">
                      <Button variant="accent" size="lg">
                        Go to Counselor Workspace →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : isPending ? (
                <div className="bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop relative">
                  <div className="text-center mb-6 pb-6 border-b-2 border-navy/20">
                    <StatusBadge text="APPLICATION UNDER REVIEW" status="warning" />
                    <h2 className="font-grotesk font-extrabold text-2xl text-navy mt-3">Counselor Application Received</h2>
                    <p className="font-body text-sm text-navy-muted mt-2">
                      Your application has been received and is currently under review by our administration team.
                    </p>
                  </div>

                  <div className="bg-yellow/20 border-3 border-navy rounded-2xl p-6 mb-6 space-y-3 font-mono text-xs text-navy">
                    <div className="flex justify-between border-b border-navy/20 pb-2">
                      <span className="font-bold">Applicant Name:</span>
                      <span>{user?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-navy/20 pb-2">
                      <span className="font-bold">Target Mentorship Domain:</span>
                      <span>{application.category?.name || application.category?.title || "Industry Counseling"}</span>
                    </div>
                    <div className="flex justify-between border-b border-navy/20 pb-2">
                      <span className="font-bold">Experience Declared:</span>
                      <span>{application.experience} Years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Application Status:</span>
                      <span className="font-extrabold text-amber-600 uppercase">Pending Verification</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link to="/auth/profile">
                      <Button variant="primary" size="md">
                        Back to Dashboard ➔
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop relative">
                  <div className="text-center mb-6 pb-6 border-b-2 border-navy/20">
                    <StatusBadge text="FAST-TRACK APPLICATION" status="success" />
                    <h2 className="font-grotesk font-extrabold text-xl text-navy mt-2">Counselor Onboarding Application</h2>
                  </div>

                  <CounselorApplicationForm categories={categories} />
                </div>
              )}
            </div>

            {/* Perks Side Card */}
            <div className="space-y-6">
              <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop">
                <StatusBadge text="MENTOR BENEFITS" status="success" />
                <h3 className="font-grotesk font-extrabold text-xl text-navy mt-3">Why Join CareerBridge?</h3>
                <ul className="mt-4 space-y-3 font-body text-xs text-navy">
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">✓</span>
                    <span>Set your own hours & flexible session availability</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">✓</span>
                    <span>Guaranteed credit payouts directly into your Indian bank account</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">✓</span>
                    <span>Verified mentor badge on your profile</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
