import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import roadmapService from '../services/roadmapService';
import LoadingScreen from '../components/LoadingScreen';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setUser } from '../features/auth/authSlice';

export default function RoadmapGenerator() {

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);

  const { mutate, data, isPending, isSuccess, isError, error } = useMutation({ mutationFn: (credentials) => roadmapService.generateRoadmap(credentials) });

  const [formData, setFormData] = useState({
    interest: location.state?.interest || "",
    skill_level: "beginner",
    budget: "Free/Low-cost",
    learning_mode: "offline",
    additional_info: ""
  });

  useEffect(() => {
    if (location.state?.interest) {
      setFormData(prev => ({ ...prev, interest: location.state.interest }));
    }
  }, [location.state]);

  const { interest, skill_level, budget, learning_mode, additional_info } = formData;

  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!isPending) return;
    const steps = [
      "Analyzing your profile & background...",
      "Synthesizing Tier-1 & Indian industry requirements...",
      "Drafting Phase 1 & 2 actionable foundations...",
      "Finalizing customized 4-phase placement roadmap..."
    ];
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [isPending]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPending) return;
    if (!interest.trim()) {
      toast.error("Please enter your career interest!");
      return;
    }
    if ((user?.credits || 0) < 1) {
      toast.error("Insufficient credits. Please request credits to generate a roadmap.");
      return;
    }
    mutate({
      token: user.token,
      ...formData
    });
  };

  useEffect(() => {

    if (isSuccess && data) {
      if (data.remainingCredits !== undefined) {
        dispatch(setUser({ ...user, credits: data.remainingCredits }));
      }
      toast.success("AI Roadmap successfully generated!");
      navigate("/auth/profile/my-roadmaps");
    }

    if (isError && error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to generate roadmap");
    }

  }, [isError, error, data, isSuccess, user, navigate, dispatch]);

  if (isPending) {
    const steps = [
      "Analyzing your profile & background...",
      "Synthesizing Tier-1 & Indian industry requirements...",
      "Drafting Phase 1 & 2 actionable foundations...",
      "Finalizing customized 4-phase placement roadmap..."
    ];
    return (
      <LoadingScreen loadingMessage={steps[stepIdx]} />
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="roadmap" />

      <div className="flex-1 flex">
        <Sidebar activeTab="roadmap" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block bg-yellow border-3 border-navy px-3 py-1 rounded-full shadow-pop-sm font-mono text-xs font-bold text-navy mb-2">
              CAREER DISCOVERY ENGINE
            </div>
            <h1 className="font-grotesk font-extrabold text-3xl text-navy">
              Generate Your Personalized <span className="text-rust">AI Roadmap</span>
            </h1>
            <p className="font-body text-sm text-navy-muted mt-1">
              Answer 5 quick questions about your goals, and CareerPath AI will draft a 4-phase structured path with realistic Indian placement milestones.
            </p>
          </div>

          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Career Field */}
              <div>
                <label className="block font-grotesk font-extrabold text-sm text-navy uppercase mb-2">
                  1. What domain or role do you want to break into?
                </label>
                <input
                  type="text"
                  name="interest"
                  onChange={handleChange}
                  value={interest}
                  placeholder="e.g. Full-Stack Web Development, Data Science, UPSC, UI/UX"
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-3 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                />
              </div>

              {/* Current Skill Level */}
              <div>
                <label className="block font-grotesk font-extrabold text-sm text-navy uppercase mb-2">
                  2. What is your current knowledge level in this area?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: 'Complete Beginner', sub: 'Starting from zero scratch' },
                    { value: 'intermediate', label: 'Intermediate', sub: 'Know fundamentals & syntax' },
                    { value: 'advanced', label: 'Advanced', sub: 'Seeking interview readiness' },
                  ].map((lvl) => (
                    <div
                      key={lvl.value}
                      onClick={() => setFormData({ ...formData, skill_level: lvl.value })}
                      className={`p-3 rounded-2xl border-3 border-navy cursor-pointer transition-all ${skill_level === lvl.value ? 'bg-yellow shadow-pop-sm' : 'bg-parchment hover:bg-parchment-dim'
                        }`}
                    >
                      <div className="font-grotesk font-extrabold text-sm text-navy">{lvl.label}</div>
                      <div className="font-mono text-[10px] text-navy-muted">{lvl.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Time Commitment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-grotesk font-extrabold text-sm text-navy uppercase mb-2">
                    3. Budget
                  </label>
                  <input
                    type="text"
                    name="budget"
                    onChange={handleChange}
                    value={budget}
                    placeholder="e.g. Free/Low-cost or ₹5,000"
                    className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-3 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-grotesk font-extrabold text-sm text-navy uppercase mb-2">
                    4. Learning Mode
                  </label>
                  <select
                    name="learning_mode"
                    value={learning_mode}
                    onChange={handleChange}
                    className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-3 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                  >
                    <option value="offline">Offline / College</option>
                    <option value="online">Online / Self-Paced</option>
                    <option value="hybrid">Hybrid (Both)</option>
                  </select>
                </div>
              </div>

              {/* Specific Ambitions or Doubts */}
              <div>
                <label className="block font-grotesk font-extrabold text-sm text-navy uppercase mb-2">
                  5. Additional background context, dream companies, or target salary
                </label>
                <textarea
                  name="additional_info"
                  rows="3"
                  onChange={handleChange}
                  value={additional_info}
                  placeholder="e.g. Targeting Tier-1 startups in Bangalore, need to balance with final year college exams..."
                  className="w-full bg-parchment border-3 border-navy rounded-xl p-4 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                ></textarea>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t-3 border-navy flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2 font-mono text-xs text-navy">
                  <span className="w-2.5 h-2.5 rounded-full bg-rust"></span>
                  <span>Cost: 1 Credit (Your Balance: {user?.credits || 0} Credits)</span>
                </div>

                <Button type="submit" variant="accent" size="lg" disabled={isPending || (user?.credits || 0) < 1}>
                  {isPending ? "Generating..." : "⚡ Generate 4-Phase Roadmap →"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
