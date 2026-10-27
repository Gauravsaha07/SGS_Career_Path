import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useMutation } from '@tanstack/react-query';
import authService from '../services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setUser } from '../features/auth/authSlice';
import LoadingScreen from '../components/LoadingScreen';

export default function LoginPage() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { mutate, data, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: (credentials) => authService.loginUser(credentials)
  });

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const { identifier, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  const getIdentifierType = () => {
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    if (trimmed.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        type: "email",
        valid: emailRegex.test(trimmed),
        label: "📧 Email Address"
      };
    } else {
      const normalized = normalizePhone(trimmed);
      const isPhone = /^[6-9]\d{9}$/.test(normalized);
      return {
        type: "phone",
        valid: isPhone,
        label: isPhone ? `📱 Mobile (+91 ${normalized})` : "📱 Mobile Number (10 digits starting with 6-9)"
      };
    }
  };

  const idTypeInfo = getIdentifierType();

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = identifier.trim();
    if (!trimmed) {
      toast.error("Please enter your email or mobile number!");
      return;
    }

    if (!password) {
      toast.error("Please enter your password!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    if (trimmed.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        toast.error("Please enter a valid email address!");
        return;
      }
    } else {
      const normalized = normalizePhone(trimmed);
      if (!/^[6-9]\d{9}$/.test(normalized)) {
        toast.error("Please enter a valid 10-digit Indian mobile number (starts with 6-9)!");
        return;
      }
    }

    mutate({
      identifier: trimmed,
      email: trimmed,
      password
    });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast("To reset your password, please contact support@careerbridge.in or your college administrator.", {
      icon: "ℹ️",
      duration: 5000
    });
  };

  const handleGoogleSignIn = () => {
    toast("Google Student SSO: Direct login available. You can log in with your registered student email.", {
      icon: "🎓",
      duration: 4000
    });
  };

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setUser(data));
      toast.success(`Welcome back, ${data.name}!`);
    }

    if (user) {
      navigate("/auth/profile");
    }

    if (isError && error) {
      toast.error(error?.response?.data?.message || error?.message || "Invalid credentials", { position: "top-center" });
    }
  }, [isSuccess, isError, user, data, error, navigate, dispatch]);

  if (isPending) {
    return (
      <LoadingScreen loadingMessage='Logging In...' />
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 bg-grid-pattern">
        <div className="w-full max-w-md bg-parchment-card border-4 border-navy rounded-3xl p-8 shadow-pop-lg relative overflow-hidden">
          <div className="absolute -top-3 -right-3 bg-rust text-white font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 border-navy rotate-6 shadow-pop-sm">
            Student Portal
          </div>

          <div className="text-center mb-8">
            <div className="inline-block bg-yellow border-3 border-navy px-4 py-1 rounded-full shadow-pop-sm font-mono text-xs font-bold text-navy mb-3">
              WELCOME BACK!
            </div>
            <h1 className="font-grotesk font-extrabold text-3xl text-navy tracking-tight">
              Sign In to <span className="text-rust">CareerBridge</span>
            </h1>
            <p className="font-body text-xs text-navy-muted mt-2">
              Access your personalized AI career roadmaps and counselor sessions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy">
                  EMAIL OR MOBILE NUMBER
                </label>
                {idTypeInfo && (
                  <span className={`font-mono text-[10px] font-bold ${idTypeInfo.valid ? 'text-teal' : 'text-rust'}`}>
                    {idTypeInfo.label}
                  </span>
                )}
              </div>
              <input
                type="text"
                name='identifier'
                onChange={handleChange}
                value={identifier}
                placeholder="e.g. aarav@example.com or 9876543210"
                className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:bg-white shadow-pop-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-grotesk font-bold text-xs uppercase tracking-wider text-navy">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={handleForgotPassword}
                  className="font-mono text-[11px] font-bold text-rust hover:underline cursor-pointer"
                >
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                name='password'
                onChange={handleChange}
                value={password}
                placeholder="Enter your password"
                className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:bg-white shadow-pop-sm"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                defaultChecked
                id="remember"
                className="w-5 h-5 bg-parchment border-2 border-navy rounded text-yellow focus:ring-0"
              />
              <label htmlFor="remember" className="font-body text-xs text-navy font-semibold">
                Remember me on this laptop
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow hover:bg-yellow-fixed text-navy font-grotesk font-extrabold text-base py-3.5 rounded-2xl border-3 border-navy shadow-pop transition-all active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              LOG IN TO DASHBOARD →
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-2 border-navy"></div>
              <span className="flex-shrink mx-4 font-mono text-[10px] font-bold text-navy-muted uppercase bg-parchment-card px-2">
                Or continue with
              </span>
              <div className="flex-grow border-t-2 border-navy"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-parchment-dim text-navy font-grotesk font-bold text-sm py-3 rounded-2xl border-3 border-navy shadow-pop-sm flex items-center justify-center space-x-3 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google Student ID</span>
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t-2 border-navy/20">
            <p className="font-body text-xs text-navy">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-grotesk font-extrabold text-rust hover:underline">
                Create Account & Claim 100 Credits →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
