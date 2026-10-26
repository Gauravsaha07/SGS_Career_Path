import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    goal: "Software Engineering",
    status: "College Student (Undergrad)",
    password: "",
    terms: true
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { name, email, phone, location, goal, status, password, terms } = formData;

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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type! Please upload a JPG, PNG, or WebP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Client-side 2 MB size validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2 MB limit! Please choose a smaller image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name!");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email address!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address!");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your mobile number!");
      return;
    }

    const normalized = normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      toast.error("Please enter a valid 10-digit Indian mobile number (starts with 6-9)!");
      return;
    }

    if (!location.trim()) {
      toast.error("Please enter your location (City, State)!");
      return;
    }

    if (!password) {
      toast.error("Please create a password!");
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

    // Prepare FormData for multipart/form-data upload
    const submitData = new FormData();
    submitData.append("name", name.trim());
    submitData.append("email", email.trim().toLowerCase());
    submitData.append("phone", normalized);
    submitData.append("location", location.trim());
    submitData.append("password", password);
    submitData.append("qualification", status);
    submitData.append("goal", goal);

    if (profileImage) {
      submitData.append("profile_image", profileImage);
    }

    mutate(submitData);
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

          <div className="text-center mb-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                  Location (City, State)
                </label>
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={handleChange}
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option>High School (9th)</option>
                  <option>High School (10th)</option>
                  <option>High School (11th/12th)</option>
                  <option>College Student (Undergrad)</option>
                  <option>Recent Graduate</option>
                  <option>Working Professional</option>
                </select>
              </div>
            </div>

            {/* Profile Picture Upload with Preview */}
            <div>
              <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy mb-1.5">
                Profile Picture (Optional)
              </label>
              <div className="flex items-center space-x-3 bg-parchment border-3 border-navy rounded-xl p-3 shadow-pop-sm">
                <div className="w-12 h-12 rounded-xl bg-sky border-2 border-navy flex items-center justify-center font-grotesk font-extrabold text-sm text-navy overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    name ? name.slice(0, 2).toUpperCase() : "CB"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                    className="w-full text-xs text-navy file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-2 file:border-navy file:text-xs file:font-grotesk file:font-bold file:bg-yellow file:text-navy hover:file:bg-yellow-fixed cursor-pointer"
                  />
                  <p className="font-mono text-[10px] text-navy-muted mt-1 truncate">
                    Max 2 MB (JPG, PNG, WebP). Default avatar used if skipped.
                  </p>
                </div>
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

            <div className="flex items-start space-x-3 pt-1">
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
              className="w-full bg-yellow hover:bg-yellow-fixed text-navy font-grotesk font-extrabold text-base py-3.5 rounded-2xl border-3 border-navy shadow-pop transition-all active:translate-x-1 active:translate-y-1 active:shadow-none mt-3 cursor-pointer"
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
