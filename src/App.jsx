import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Library, Search, User, Settings, LogOut } from "lucide-react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import LibraryPage from "./pages/Library";
import { useDebounce } from "react-use";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useDebounce(() => setdebouncedSearchTerm(searchQuery), 500, [searchQuery]);

  const handleLogOut = async () => {
    await auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    console.log(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 rounded-b-2xl shadow-lg">
      <div className="w-screen  px-4 py-3 flex items-center justify-between">
        {/* Navigation Links */}
        <nav className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-100 hover:text-white glow"
          >
            <Home className="h-5 w-5 text-gray-300" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <span className="text-gray-500">|</span>

          <Link
            to="/library"
            className="flex items-center space-x-2 text-gray-100 hover:text-white glow"
          >
            <Library className="h-5 w-5 text-gray-300" />
            <span className="hidden sm:inline">Library</span>
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="flex-grow max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="search"
              placeholder="Search for songs, artists, or albums"
              className="pl-8 w-full bg-gray-800 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-2xl p-2 focus:ring-2 focus:ring-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="focus:outline-none">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-600 transition hover:shadow-[0_0_10px_rgb(255,255,255,0.8)] bg-gradient-to-b from-gray-700 to-gray-500">
              {user ? (
                <span className="text-white text-lg font-semibold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              ) : (
                <img
                  src="./person.png"
                  alt="User"
                  className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-500"
                />
              )}
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            align="end"
            className="bg-gray-800 text-gray-100 shadow-lg rounded-md w-56 p-2"
          >
            <DropdownMenu.Item className="p-2 flex items-center space-x-2 hover:bg-gray-700 cursor-pointer transition">
              <User className="h-4 w-4 text-gray-300" />
              <span>Profile</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="p-2 flex items-center space-x-2 hover:bg-gray-700 cursor-pointer transition">
              <Settings className="h-4 w-4 text-gray-300" />
              <span>Settings</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 border-b border-gray-600" />
            <DropdownMenu.Item
              className="p-2 flex items-center space-x-2 text-red-500 hover:bg-gray-700 cursor-pointer transition"
              onClick={handleLogOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setvolume] = useState(50);
  const progress = 50;
  // useEffect(() => {
  //   console.log(volume);
  // }, [volume]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
      {/* Song Info */}
      <div className="flex items-center space-x-3">
        <img
          src="/image.png"
          alt="Album Cover"
          className={`h-10 w-10 rounded-lg bg-gradient-to-b from-gray-700 to-gray-500 transition ${
            isPlaying ? "pulse-glow" : ""
          }`}
        />
        <div>
          <p className="text-white text-sm font-semibold">Song Title</p>
          <p className="text-gray-400 text-xs">Artist Name</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <button className="text-gray-300 hover:text-white transition">
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          className="bg-white text-black p-2 rounded-full hover:scale-105 transition"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        <button className="text-gray-300 hover:text-white transition">
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center space-x-2">
        <Volume2 className="h-5 w-5 text-gray-300" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setvolume(e.target.value)}
          className="w-16 h-[4px] bg-gray-500 rounded-lg"
        />
      </div>

      <div
        className={`absolute bottom-0 justify-center left-1 w-[calc(100%-7px)] h-1 bg-gray-700 rounded-b-2xl overflow-hidden 
          transition-opacity duration-500 ease-in-out transform 
          ${
            isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-0"
          }`}
      >
        <div
          className="h-full bg-blue-400 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  return (
    <>
      {!isAuthPage && <Header />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/library" element={<PageTransition><LibraryPage /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {!isAuthPage && <Player />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
