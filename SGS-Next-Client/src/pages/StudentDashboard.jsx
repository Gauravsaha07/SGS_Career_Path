import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import roadmapService from '../services/roadmapService';
import authService from '../services/authService';
import { setUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "",
    qualification: user?.qualification || "College Student (Undergrad)"
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(user?.profilePic || null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        location: user.location || "",
        qualification: user.qualification || "College Student (Undergrad)"
      });
      setEditImagePreview(user.profilePic || null);
    }
  }, [user]);

  // Sync latest user profile and credits
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

  useEffect(() => {
    const role = (user?.userType || '').toUpperCase();
    if (role === "ADMIN") {
      navigate("/auth/admin");
    } else if (role === "COUNSELOR") {
      navigate("/auth/counselor");
    }
  }, [user, navigate]);

  // Fetch real roadmaps from DB
  const { data: roadmaps = [], isLoading: loadingRoadmaps } = useQuery({
    queryKey: ['myRoadmaps', user?._id],
    queryFn: () => roadmapService.fetchMyRoadmaps(user?.token),
    enabled: !!user?.token
  });

  const handleEditChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type! Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2 MB limit! Please choose a smaller image.");
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const normalizePhone = (input) => {
    if (!input) return "";
    let cleaned = input.toString().replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    return cleaned;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Name cannot be empty!");
      return;
    }

    if (!profileForm.location.trim()) {
      toast.error("Location cannot be empty!");
      return;
    }

    let normalizedPhone = "";
    if (profileForm.phone.trim()) {
      normalizedPhone = normalizePhone(profileForm.phone);
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number (starts with 6-9)!");
        return;
      }
    }

    setIsUpdating(true);
    try {
      const submitData = new FormData();
      submitData.append("name", profileForm.name.trim());
      submitData.append("location", profileForm.location.trim());
      submitData.append("qualification", profileForm.qualification);
      if (normalizedPhone) {
        submitData.append("phone", normalizedPhone);
      }
      if (editImageFile) {
        submitData.append("profile_image", editImageFile);
      }

      const updated = await authService.updateProfile(submitData, user.token);
      dispatch(setUser({ ...user, ...updated, token: user.token }));
      toast.success("Profile updated successfully!");
      setShowEditModal(false);
      setEditImageFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const upcomingSessions = [
    {
      id: 1,
      counselor: 'Dr. Ramesh Kumar',
      role: 'Ex-Google SDE3 / IIT Bombay Mentor',
      date: 'Tomorrow, 5:00 PM IST',
      topic: 'Full-Stack System Design Mock Interview',
      status: 'Confirmed',
      avatar: 'RK',
    },
    {
      id: 2,
      counselor: 'Ananya Roy',
      role: 'Lead Product Designer @ Swiggy',
      date: 'Saturday, 11:00 AM IST',
      topic: 'UI/UX Portfolio & Case Study Review',
      status: 'Pending Host',
      avatar: 'AR',
    },
  ];

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="dashboard" />

      <div className="flex-1 flex">
        <Sidebar activeTab="overview" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop mb-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-sky border-3 border-navy flex items-center justify-center font-grotesk font-extrabold text-xl text-navy shadow-pop-sm overflow-hidden shrink-0 mt-1">
                  {user?.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.slice(0, 2).toUpperCase() : 'CB'
                  )}
                </div>

                <div>
                  <div className="inline-block bg-navy text-yellow font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-1">
                    Student Workspace • {user?.name}
                  </div>
                  <h1 className="font-grotesk font-extrabold text-2xl sm:text-3xl text-navy">
                    Namaste, {user?.name}! Ready to level up? ⚡
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-navy-muted mt-1">
                    You have <span className="font-bold text-navy">{user?.credits ?? 0} Credits</span> available. Your current level is <span className="font-bold text-rust">{user?.qualification || 'Undergraduate'}</span>.
                  </p>
                  <p className="font-mono text-xs text-navy mt-1">
                    📍 {user?.location || 'India'} • 📱 {user?.phone || 'Mobile not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="font-grotesk border-2 border-navy tracking-wide rounded-full transition-all active:translate-x-1 active:translate-y-1 px-4 py-2.5 text-xs sm:text-sm font-extrabold bg-white text-navy hover:bg-parchment-dim shadow-pop-sm cursor-pointer"
                >
                  Edit Profile ✏️
                </button>
                <Link to={"/auth/ai-roadmap"} className="font-grotesk border border-black tracking-wide rounded-full transition-all active:translate-x-1 active:translate-y-1 active:shadow-none px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold bg-yellow text-navy hover:bg-yellow-fixed border-3 border-navy shadow-pop">
                  + Generate Roadmap
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card color="white" className="border-3">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Active Roadmaps</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">
                {loadingRoadmaps ? '...' : `${roadmaps.length} ${roadmaps.length === 1 ? 'Path' : 'Paths'}`}
              </div>
              <div className="text-xs text-rust font-bold mt-1">
                {roadmaps.length > 0 ? `⚡ ${roadmaps[0].progress || 0}% on ${roadmaps[0].targetRole || 'Current Track'}` : '⚡ 0% Start your first path'}
              </div>
            </Card>

            <Card color="white" className="border-3">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Booked Sessions</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">1 Active</div>
              <div className="text-xs text-teal font-bold mt-1">Next session via Chat</div>
            </Card>

            <Card color="white" className="border-3">
              <div className="font-mono text-xs font-bold text-navy-muted uppercase">Credits Wallet</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{user?.credits ?? 0} pts</div>
              <div className="text-xs text-rust font-bold mt-1">Instant Top-up Available</div>
            </Card>

            <Card color="yellow" className="border-3">
              <div className="font-mono text-xs font-bold text-navy uppercase">Profile Mastery</div>
              <div className="font-grotesk font-extrabold text-3xl text-navy mt-2">{user?.qualification ? '90%' : '75%'}</div>
              <div className="text-xs text-navy font-bold mt-1">{user?.qualification ? 'College verified' : 'Complete details'}</div>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Active Roadmaps & Sessions */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Roadmaps Section */}
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-grotesk font-extrabold text-xl text-navy">My AI Career Roadmaps</h2>
                    <p className="font-body text-xs text-navy-muted">Step-by-step guidance powered by real Indian job market data</p>
                  </div>
                  <Link to="/auth/profile/my-roadmaps" className="font-grotesk font-bold text-xs text-rust hover:underline">
                    View All Roadmaps →
                  </Link>
                </div>

                <div className="space-y-4">
                  {loadingRoadmaps ? (
                    <div className="text-center py-8 font-mono text-xs text-navy animate-pulse">
                      Loading your AI Roadmaps...
                    </div>
                  ) : roadmaps.length === 0 ? (
                    <div className="bg-parchment border-3 border-navy rounded-2xl p-6 text-center shadow-pop-sm">
                      <p className="font-grotesk font-bold text-navy text-sm mb-2">No active roadmaps found yet!</p>
                      <p className="font-body text-xs text-navy-muted mb-4">
                        Generate your first AI-tailored career roadmap in seconds with 10 credits.
                      </p>
                      <Link to="/auth/ai-roadmap">
                        <Button variant="primary" size="sm">
                          + Generate Your First Roadmap
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    roadmaps.slice(0, 3).map((rm) => {
                      const progressVal = rm.progress ?? (rm.phases?.length ? Math.round(((rm.completedPhases?.length || 0) / rm.phases.length) * 100) : 0);
                      const currentStage = rm.phases?.[rm.completedPhases?.length || 0]?.phaseTitle || rm.phases?.[0]?.phaseTitle || 'Phase 1: Foundations';
                      const salary = rm.marketInsights?.salaryRange || '₹8L - ₹15L / year';
                      const badgeText = progressVal >= 100 ? 'COMPLETED' : 'ACTIVE TRACK';

                      return (
                        <div key={rm._id} className="bg-parchment border-3 border-navy rounded-2xl p-5 shadow-pop-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-grotesk font-extrabold text-base text-navy">
                                  {rm.targetRole || rm.title || 'AI Career Track'}
                                </span>
                                <StatusBadge text={badgeText} status="success" />
                              </div>
                              <p className="font-body text-xs text-navy-muted mt-1">
                                Current Stage: <span className="font-bold text-navy">{currentStage}</span>
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-rust bg-rust-container px-2.5 py-1 rounded-full border border-navy">
                              {salary}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs font-mono font-bold mb-1">
                              <span>Overall Progress</span>
                              <span>{progressVal}%</span>
                            </div>
                            <div className="w-full bg-parchment-dim border-2 border-navy h-4 rounded-full overflow-hidden">
                              <div
                                className="bg-yellow h-full border-r-2 border-navy transition-all"
                                style={{ width: `${progressVal}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/auth/profile/my-roadmaps', { state: { selectedId: rm._id } })}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate('/auth/profile/my-roadmaps', { state: { selectedId: rm._id } })}
                            >
                              Continue Phase →
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Counseling Sessions */}
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-grotesk font-extrabold text-xl text-navy">Upcoming 1-on-1 Sessions</h2>
                    <p className="font-body text-xs text-navy-muted">Live 1-on-1 mentorship with verified industry leaders</p>
                  </div>
                  <Link to="/auth/counselors" className="font-grotesk font-bold text-xs text-rust hover:underline">
                    Browse Counselors →
                  </Link>
                </div>

                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="bg-sky/20 border-3 border-navy rounded-2xl p-4 flex items-center justify-between shadow-pop-sm">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky border-2 border-navy flex items-center justify-center font-grotesk font-extrabold text-lg text-navy shadow-pop-sm">
                          {session.avatar}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-grotesk font-extrabold text-base text-navy">{session.counselor}</h3>
                            <StatusBadge text={session.status} status="info" />
                          </div>
                          <p className="font-mono text-xs text-navy-muted">{session.role}</p>
                          <p className="font-body text-xs font-bold text-rust mt-1">📌 {session.topic}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-navy mb-2">{session.date}</div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate('/auth/profile/chat')}
                        >
                          Join Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Tools & Credit Summary */}
            <div className="space-y-8">
              {/* Credit Wallet Widget */}
              <div className="bg-rust-container border-4 border-navy rounded-3xl p-6 shadow-pop relative overflow-hidden">
                <div className="font-mono text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  CREDIT BALANCE
                </div>
                <div className="font-grotesk font-extrabold text-4xl text-navy">
                  {user?.credits ?? 0} <span className="text-base font-normal">pts</span>
                </div>
                <p className="font-body text-xs text-navy mt-2">
                  1 Session = 50 Credits • 1 AI Roadmap = 10 Credits
                </p>

                <div className="mt-4 pt-4 border-t-2 border-navy/20">
                  <Button
                    variant="accent"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/auth/profile/my-credits')}
                  >
                    Buy Top-Up Credit Pack →
                  </Button>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h3 className="font-grotesk font-extrabold text-lg text-navy mb-4">Quick Student Tools</h3>
                <div className="space-y-3">
                  <Link
                    to="/auth/careers"
                    className="block bg-parchment border-2 border-navy p-3 rounded-xl hover:bg-yellow transition-all font-grotesk font-bold text-xs text-navy shadow-pop-sm flex items-center justify-between"
                  >
                    <span>🎯 Explore High Salary Tech Careers</span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/auth/ai-roadmap"
                    className="block bg-parchment border-2 border-navy p-3 rounded-xl hover:bg-yellow transition-all font-grotesk font-bold text-xs text-navy shadow-pop-sm flex items-center justify-between"
                  >
                    <span>📄 AI Career Roadmap Generator</span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/auth/profile/chat"
                    className="block bg-parchment border-2 border-navy p-3 rounded-xl hover:bg-yellow transition-all font-grotesk font-bold text-xs text-navy shadow-pop-sm flex items-center justify-between"
                  >
                    <span>💬 Practice Mock Interview Chat</span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/auth/profile/become-counselor"
                    className="block bg-parchment border-2 border-navy p-3 rounded-xl hover:bg-yellow transition-all font-grotesk font-bold text-xs text-navy shadow-pop-sm flex items-center justify-between"
                  >
                    <span>🎓 Apply as Student Ambassador / Counselor</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Recommended Counselor Highlight */}
              <div className="bg-yellow border-4 border-navy rounded-3xl p-6 shadow-pop">
                <StatusBadge text="SPOTLIGHT MENTOR" status="success" />
                <h3 className="font-grotesk font-extrabold text-xl text-navy mt-3">Sneha Mukherjee</h3>
                <p className="font-body text-xs text-navy-muted">Senior AI Engineer @ Microsoft Hyderabad</p>
                <p className="font-body text-xs text-navy mt-2 italic">
                  "Specialized in helping Tier-2 & Tier-3 college students land top product tech roles."
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/auth/counselors')}
                  >
                    Book Session (50 Credits)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-pop-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-navy/20">
              <div>
                <span className="inline-block bg-yellow border-2 border-navy font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  STUDENT PROFILE
                </span>
                <h3 className="font-grotesk font-extrabold text-xl text-navy mt-1">Edit Profile Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="font-mono font-bold text-navy text-sm p-1 hover:text-rust"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Image with preview and picker */}
              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-3 bg-parchment border-2 border-navy rounded-xl p-3">
                  <div className="w-14 h-14 rounded-xl bg-sky border-2 border-navy flex items-center justify-center font-grotesk font-extrabold text-sm text-navy overflow-hidden shrink-0">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name.slice(0, 2).toUpperCase() : "CB"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleEditImageChange}
                      className="w-full text-xs text-navy file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-2 file:border-navy file:text-xs file:font-grotesk file:font-bold file:bg-yellow file:text-navy hover:file:bg-yellow-fixed cursor-pointer"
                    />
                    <p className="font-mono text-[10px] text-navy-muted mt-1 truncate">
                      Max 2 MB (JPG, PNG, WebP).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleEditChange}
                  className="w-full bg-parchment border-2 border-navy rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleEditChange}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-parchment border-2 border-navy rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileForm.location}
                    onChange={handleEditChange}
                    placeholder="e.g. Bhopal, Madhya Pradesh"
                    className="w-full bg-parchment border-2 border-navy rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1">
                  Current Status / Qualification
                </label>
                <select
                  name="qualification"
                  value={profileForm.qualification}
                  onChange={handleEditChange}
                  className="w-full bg-parchment border-2 border-navy rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none"
                >
                  <option>High School (9th)</option>
                  <option>High School (10th)</option>
                  <option>High School (11th/12th)</option>
                  <option>College Student (Undergrad)</option>
                  <option>Recent Graduate</option>
                  <option>Working Professional</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t-2 border-navy/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
