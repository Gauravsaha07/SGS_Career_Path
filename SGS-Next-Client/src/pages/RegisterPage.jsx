import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import authService from '../services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    goal: "Software Engineering",
    status: "College Student (Undergrad)",
    password: "",
    terms: true
  });

  const { name, email, goal, status, password, terms } = formData;

  const { mutate, data, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: (credentials) => authService.registerUser(credentials)
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in your name, email, and password!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }
    if (!terms) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      qualification: status,
      location: "India",
      goal: goal
    });
  };

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setUser(data));
      toast.success("Welcome to CareerBridge! 100 free credits added to your wallet 🎉");
      navigate("/auth/profile");
    }

    if (user) {
      navigate("/auth/profile");
    }

    if (isError && error) {
      toast.error(error?.response?.data?.message || error?.message || "Registration failed");
    }
  }, [isSuccess, isError, user, data, error, navigate, dispatch]);

  if (isPending) {
    return <LoadingScreen loadingMessage="Creating Account & Claiming 100 Credits..." />;
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 bg-grid-pattern">
        <div className="w-full max-w-lg bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop-lg relative">
          <div className="absolute -top-3 -right-3 bg-yellow text-navy font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 border-navy -rotate-3 shadow-pop-sm">
            Claim 100 Free Credits
          </div>

          <div className="text-center mb-8">
            <div className="inline-block bg-rust-container border-3 border-navy px-4 py-1 rounded-full shadow-pop-sm font-mono text-xs font-bold text-navy mb-3">
              START YOUR JOURNEY 🚀
            </div>
            <h1 className="font-grotesk font-extrabold text-3xl text-navy tracking-tight">
              Join <span className="text-rust">CareerBridge</span> India
            </h1>
            <p className="font-body text-xs text-navy-muted mt-2">
              Build AI career roadmaps, discover Indian tech & Govt jobs, and connect with top counselors.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="e.g. Priya Patel"
                className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="priya@example.com"
                className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                  Primary Goal
                </label>
                <select
                  name="goal"
                  value={goal}
                  onChange={handleChange}
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                >
                  <option>Software Engineering</option>
                  <option>Data Science & AI</option>
                  <option>UI/UX Product Design</option>
                  <option>UPSC / SSC Govt Exams</option>
                  <option>MBA / Management</option>
                </select>
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                  Current Status
                </label>
                <select
                  name="status"
                  value={status}
                  onChange={handleChange}
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                >
                  <option>College Student (Undergrad)</option>
                  <option>Recent Graduate</option>
                  <option>Working Professional</option>
                  <option>High School (11th/12th)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                Create Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <input
                type="checkbox"
                name="terms"
                checked={terms}
                onChange={handleChange}
                id="terms"
                className="w-5 h-5 bg-parchment border-2 border-navy rounded text-yellow focus:ring-0 mt-0.5"
              />
              <label htmlFor="terms" className="font-body text-xs text-navy">
                I agree to the <span onClick={() => toast("Standard terms: 100 free credits granted for educational career guidance on CareerBridge India.", { icon: "📜" })} className="font-bold underline text-rust cursor-pointer">Terms of Service</span> and{' '}
                <span onClick={() => toast("Privacy: Your personal information is encrypted and never sold.", { icon: "🔒" })} className="font-bold underline text-rust cursor-pointer">Privacy Policy</span> of CareerBridge India.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow hover:bg-yellow-fixed text-navy font-grotesk font-extrabold text-base py-3.5 rounded-2xl border-3 border-navy shadow-pop transition-all active:translate-x-1 active:translate-y-1 active:shadow-none mt-4 cursor-pointer"
            >
              CREATE FREE ACCOUNT & CLAIM CREDITS →
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t-2 border-navy/20">
            <p className="font-body text-xs text-navy">
              Already have an account?{' '}
              <Link to="/login" className="font-grotesk font-extrabold text-rust hover:underline">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
