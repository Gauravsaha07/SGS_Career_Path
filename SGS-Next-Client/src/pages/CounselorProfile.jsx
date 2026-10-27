import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import counselorService from '../services/counselorService';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

export default function CounselorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { user } = useSelector(state => state.auth);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");

  const { data: counselor, isLoading, isError } = useQuery({
    queryKey: ['counselor', id],
    queryFn: () => counselorService.fetchCounselorById(id),
    enabled: !!id
  });

  const defaultSlots = [
    { day: 'Friday', time: '05:00 PM IST', active: true },
    { day: 'Friday', time: '07:30 PM IST', active: true },
    { day: 'Saturday', time: '11:00 AM IST', active: true },
    { day: 'Saturday', time: '04:00 PM IST', active: true },
    { day: 'Sunday', time: '06:00 PM IST', active: true },
  ];

  const counselorSlots = (counselor?.availableSlots && counselor.availableSlots.length > 0)
    ? counselor.availableSlots.map(s => ({
        day: s.day,
        time: s.time,
        available: s.active !== false
      }))
    : defaultSlots.map(s => ({
        day: s.day,
        time: s.time,
        available: s.active !== false
      }));

  const bookMutation = useMutation({
    mutationFn: (bookingPayload) => counselorService.bookSession(counselor._id, bookingPayload, user.token),
    onSuccess: (data) => {
      if (data.remainingCredits !== undefined) {
        dispatch(setUser({ ...user, credits: data.remainingCredits }));
      }
      toast.success(data.message || "Session booked successfully!");
      const targetId = counselor.user?._id || counselor.user || counselor._id;
      navigate('/auth/profile/chat', { state: { targetUserId: targetId } });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Booking failed");
    }
  });

  const ratingMutation = useMutation({
    mutationFn: (ratingPayload) => counselorService.addRating(counselor._id, ratingPayload, user.token),
    onSuccess: () => {
      toast.success("Thank you for your rating & review!");
      setShowReviewForm(false);
      setNewReviewText("");
      queryClient.invalidateQueries({ queryKey: ['counselor', id] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Could not submit review");
    }
  });

  const handleBookSession = () => {
    if (!user) {
      toast.error("Please login to book a session!");
      navigate('/login');
      return;
    }
    if ((user.credits || 0) < 50) {
      toast.error("Insufficient credits! You need 50 credits to book a session. Please top-up.");
      navigate('/auth/profile/my-credits');
      return;
    }

    const selectedSlot = counselorSlots[selectedSlotIndex];
    const slotString = selectedSlot ? `${selectedSlot.day} - ${selectedSlot.time}` : "Upcoming Available Slot";

    bookMutation.mutate({
      slot: slotString,
      topic: `1-on-1 Mentorship (${counselor.category?.title || counselor.categoryTitle || 'General'})`
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) {
      toast.error("Please enter review comments!");
      return;
    }
    ratingMutation.mutate({
      rating: Number(newRating),
      review: newReviewText.trim()
    });
  };

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Mentor Profile..." />;
  }

  const effectiveRole = (user?.userType || 'student').toLowerCase();

  if (isError || !counselor) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col">
        <Navbar activePage="counselors" />
        <div className="flex-1 flex">
          <Sidebar activeTab="counselors" role={effectiveRole} />
          <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
            <div className="bg-parchment-card border-4 border-navy rounded-3xl p-12 text-center shadow-pop max-w-xl mx-auto">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-grotesk font-extrabold text-2xl text-navy">Counselor Not Found</h2>
              <p className="font-body text-xs text-navy-muted mt-2">The mentor profile you requested is currently unavailable.</p>
              <Button clickAction={() => navigate('/auth/counselors')} variant="primary" size="md" className="mt-6">
                ← Back to Counselor List
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const counselorName = counselor.displayName || counselor.user?.name || counselor.name || "Career Counselor";
  const counselorPic = counselor.user?.profilePic || counselor.profilePic;
  const counselorLocation = counselor.displayLocation || counselor.user?.location || counselor.location || "India";
  const counselorQual = counselor.displayQualification || counselor.user?.qualification || counselor.qualification || "Senior Industry Mentor";
  const counselorCategory = counselor.displayCategory || counselor.category?.title || counselor.category?.name || counselor.categoryTitle || "Career Mentorship";
  const counselorExp = counselor.experience ?? 3;
  const counselorInitials = counselorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CN';

  const reviewsList = counselor.ratings || [];

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="counselors" />

      <div className="flex-1 flex">
        <Sidebar activeTab="counselors" role={effectiveRole} />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="mb-4">
            <Link to="/auth/counselors" className="font-grotesk font-bold text-xs text-navy hover:text-rust flex items-center space-x-1">
              <span>← Back to Counselor List</span>
            </Link>
          </div>

          <div className="bg-yellow border-4 border-navy rounded-3xl p-8 shadow-pop mb-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 rounded-3xl bg-parchment-card border-4 border-navy flex items-center justify-center font-grotesk font-extrabold text-3xl text-navy shadow-pop overflow-hidden shrink-0">
                  {counselorPic ? (
                    <img className="w-full h-full object-cover" src={counselorPic} alt={counselorName} />
                  ) : (
                    <span>{counselorInitials}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="font-grotesk font-extrabold text-3xl text-navy">{counselorName}</h1>
                    <StatusBadge text="VERIFIED MENTOR" status="success" />
                  </div>
                  <p className="font-mono text-sm font-bold text-navy-muted">
                    {counselorCategory} Mentor • {counselorQual}
                  </p>
                  <p className="font-body text-xs text-navy mt-1">
                    📍 {counselorLocation} • {counselorExp}+ Years Industry Experience • ★ {counselor.avgRating || "5.0"} ({reviewsList.length} Reviews)
                  </p>
                </div>
              </div>

              <div className="bg-parchment-card border-3 border-navy p-4 rounded-2xl shadow-pop-sm text-center">
                <div className="font-mono text-[10px] font-bold text-navy-muted uppercase">Session Fee</div>
                <div className="font-grotesk font-extrabold text-2xl text-rust">50 Credits</div>
                <div className="font-mono text-[10px] font-bold text-navy mt-0.5">45 Min Video Call + Notes</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h2 className="font-grotesk font-extrabold text-xl text-navy mb-3">About {counselorName}</h2>
                <p className="font-body text-sm text-navy leading-relaxed mb-4">
                  {counselor.displayBio || `${counselorName} has over ${counselorExp} years of industry experience specializing in ${counselorCategory}. Passionate about democratizing quality career guidance, resume reviews, and technical interview preparation for college graduates across Tier-1, Tier-2, and Tier-3 Indian universities.`}
                </p>

                <h3 className="font-grotesk font-bold text-sm text-navy mb-2">Primary Consultation Areas:</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-sky/20 border-2 border-navy p-2.5 rounded-xl font-mono text-xs text-navy font-bold">
                    ✔ 1-on-1 Portfolio & Resume Review
                  </div>
                  <div className="bg-sky/20 border-2 border-navy p-2.5 rounded-xl font-mono text-xs text-navy font-bold">
                    ✔ Mock Technical & Behavioral Rounds
                  </div>
                  <div className="bg-sky/20 border-2 border-navy p-2.5 rounded-xl font-mono text-xs text-navy font-bold">
                    ✔ Career Switching Roadmap Strategy
                  </div>
                  <div className="bg-sky/20 border-2 border-navy p-2.5 rounded-xl font-mono text-xs text-navy font-bold">
                    ✔ Placement Prep & Salary Negotiation
                  </div>
                </div>
              </div>

              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-grotesk font-extrabold text-xl text-navy">Student Reviews & Ratings</h2>
                    <p className="font-mono text-xs text-rust font-bold">★ {counselor.avgRating || "5.0"} Average Rating ({reviewsList.length} reviews)</p>
                  </div>
                  <Button
                    clickAction={() => setShowReviewForm(!showReviewForm)}
                    variant={showReviewForm ? "outline" : "accent"}
                    size="sm"
                  >
                    {showReviewForm ? "Cancel Review" : "+ Rate Counselor"}
                  </Button>
                </div>

                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="bg-yellow/20 border-2 border-navy p-4 rounded-2xl mb-6 space-y-3">
                    <div className="font-grotesk font-bold text-xs uppercase text-navy">Leave Your Feedback</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-navy font-bold">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`text-lg cursor-pointer ${star <= newRating ? 'text-rust' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="font-mono text-xs font-bold text-rust ml-2">{newRating}.0</span>
                    </div>
                    <textarea
                      rows="3"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Share your experience with this mentor..."
                      className="w-full bg-white border-2 border-navy rounded-xl p-3 font-body text-xs text-navy focus:outline-none"
                    ></textarea>
                    <Button type="submit" variant="primary" size="sm">
                      Submit Review ✓
                    </Button>
                  </form>
                )}

                <div className="space-y-4">
                  {reviewsList.length === 0 ? (
                    <div className="bg-parchment border-2 border-dashed border-navy/40 p-6 rounded-2xl text-center">
                      <span className="text-2xl mb-2 block">⭐</span>
                      <p className="font-grotesk font-bold text-sm text-navy">No reviews yet for this counselor</p>
                      <p className="font-body text-xs text-navy-muted mt-1">
                        Book a session and be the first to share your mentorship experience!
                      </p>
                    </div>
                  ) : (
                    reviewsList.map((rev, idx) => (
                      <div key={rev._id || idx} className="bg-parchment border-2 border-navy p-4 rounded-2xl shadow-pop-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-grotesk font-bold text-sm text-navy">
                            {rev.user?.name || "Verified Student"}
                          </span>
                          <span className="font-mono text-xs font-bold text-rust">
                            {rev.rating ? `${rev.rating}.0 ★` : "5.0 ★"}
                          </span>
                        </div>
                        <p className="font-body text-xs text-navy-muted">
                          "{rev.review || rev.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h3 className="font-grotesk font-extrabold text-lg text-navy mb-1">Book 1-on-1 Session</h3>
                <p className="font-body text-xs text-navy-muted mb-4">Select an available IST time slot for your call:</p>

                <div className="space-y-2.5 mb-6">
                  {counselorSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      onClick={() => slot.available && setSelectedSlotIndex(idx)}
                      className={`p-3 rounded-xl border-2 border-navy flex justify-between items-center font-mono text-xs cursor-pointer transition-all ${slot.available
                          ? selectedSlotIndex === idx
                            ? 'bg-yellow font-bold shadow-pop-sm'
                            : 'bg-parchment hover:bg-parchment-dim'
                          : 'bg-gray-200 text-gray-400 opacity-60 cursor-not-allowed'
                        }`}
                    >
                      <div>
                        <div>{slot.day}</div>
                        <div className="font-bold">{slot.time}</div>
                      </div>
                      <span className="text-[10px] font-bold">
                        {slot.available ? (selectedSlotIndex === idx ? 'SELECTED' : 'Available') : 'Booked'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-rust-container border-2 border-navy p-3 rounded-xl mb-4 font-mono text-xs flex justify-between items-center">
                  <span>Your Credit Balance:</span>
                  <span className="font-bold text-navy">{user?.credits || 0} Credits</span>
                </div>

                <Button
                  clickAction={handleBookSession}
                  variant="accent"
                  size="lg"
                  className="w-full"
                >
                  {bookMutation.isPending ? "Deducting Credits..." : "CONFIRM & DEDUCT 50 CREDITS →"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
