import React, { useEffect } from "react";
import { Mail, Lock, Music2, Notebook } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { auth, createUserWithEmailAndPassword } from "../firebase/firebase";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;
      console.log('Signed up: ',user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User already logged in as ',user);
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const musicNotes = useMemo(() => {
    return [...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 20 + 20,
      delay: `${Math.random() * 2}s`,
    }));
  }, []);

  const waveformBars = useMemo(() => {
    return [...Array(12)].map(() => ({
      height: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
    }));
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated music notes background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Circular gradient overlays */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          {musicNotes.map((note, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                top: note.top,
                left: note.left,
                animationDelay: note.delay,
              }}
            >
              <Music2
                className="text-white/50 transform rotate-12"
                size={note.size}
              />
            </div>
          ))}
        </div>

        {/* Animated waveform-like bars */}
        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-around opacity-20">
          {waveformBars.map((bar, i) => (
            <div
              key={i}
              className="w-2 bg-white rounded-t-full animate-pulse"
              style={{
                height: bar.height,
                animationDelay: bar.delay,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Login container */}
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
            <p className="text-gray-400">Sign in to your music journey</p>
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSignUp}>
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-300 block"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-200 rounded-lg py-2.5 px-10 focus:ring-2 focus:ring-white/10 focus:border-gray-600 transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 block"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-200 rounded-lg py-2.5 px-10 focus:ring-2 focus:ring-white/10 focus:border-gray-600 transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Re-enter Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 block"
              >
                Re-enter password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="confirm-password"
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-200 rounded-lg py-2.5 px-10 focus:ring-2 focus:ring-white/10 focus:border-gray-600 transition-all"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-white text-gray-900 font-semibold rounded-lg py-3 px-4 hover:bg-gray-100 hover:shadow-[0_0_10px_rgb(255,255,255,0.8)] cursor-pointer focus:ring-2 focus:ring-white/10 transition-all"
            >
              Sign Up
            </button>

            {/* Sign up link */}
            <p className="text-center text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={() => navigate("/login")}
              >
                Login instead
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
