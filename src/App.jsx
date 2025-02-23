import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Library, Search, User, Settings, LogOut } from "lucide-react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import LibraryPage from "./pages/Library";
import { useDebounce } from "react-use";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TrackInfo from "./components/TrackInfo";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useGlobalContext } from "./GlobalContext";
import SearchPage from "./pages/SearchPage";

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && debouncedSearchTerm !=="") {
      navigate(`/search/${debouncedSearchTerm}`);
    }
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
              onKeyDown={handleKeyPress}
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
  const { trackList, setTrackList } = useGlobalContext();
  const { isPlaying, setIsPlaying } = useGlobalContext();
  const { currentTrack, setCurrentTrack } = useGlobalContext();
  const { errorPlaying, setErrorPlaying } = useGlobalContext();
  const { urlPlay, setUrlPlay } = useGlobalContext();
  const audioRef = useRef(null);

  // Local states
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Add event listeners to sync audio state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentIndex < queue.length - 1) {
        handleNext();
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, queue.length, setIsPlaying]);

  // Update queue when trackList changes
  useEffect(() => {
    if (trackList.length > 0) {
      setQueue((prevQueue) => [...prevQueue, ...trackList]);
      setTrackList([]);
    }
  }, [trackList, setTrackList]);

  const fetchTrackData = useCallback(
    async (trackName) => {
      console.log("fetching...");
      try {
        const response = await fetch(
          `https://saavn.dev/api/search/songs?query=${trackName}&limit=1`
        );
        if (!response.ok) throw new Error("Failed to fetch track data");

        const data = await response.json();
        if (!data?.data?.results?.length) {
          throw new Error("No track found");
        }

        console.log(data.data.results[0]);
        setUrlPlay(data.data.results[0]);
        setErrorPlaying("");
        return data.data.results[0];
      } catch (err) {
        setErrorPlaying(`Error fetching track: ${err.message}`);
        setUrlPlay(null);
        return null;
      }
    },
    [setUrlPlay, setErrorPlaying]
  );

  const loadTrack = useCallback(
    async (index) => {
      if (index >= 0 && index < queue.length) {
        console.log("loadtrack");
        const trackName = queue[index];
        const trackData = await fetchTrackData(trackName);

        if (trackData) {
          setCurrentTrack(trackName);
          setCurrentIndex(index);
          // if (!isPlaying) {
          //   setIsPlaying(true);
          // }
          // Attempt to play after loading new track
          try {
            const playPromise = audioRef.current?.play();
            if (playPromise) {
              console.log("Attempting to play next");
              playPromise.catch((error) => {
                console.error("Playback failed:", error);
                setIsPlaying(false);
              });
            }
          } catch (error) {
            console.error("Play error:", error);
            setIsPlaying(false);
          }
        }
      }
    },
    [queue, fetchTrackData, setCurrentTrack, setIsPlaying, isPlaying]
  );

  const playTrackDirectly = useCallback(
    async (trackName) => {
      console.log("Playing track directly:", trackName);
      const trackData = await fetchTrackData(trackName);

      if (trackData) {
        setCurrentTrack(trackName);
        // Don't update queue or currentIndex since this is direct playback
        try {
          const playPromise = audioRef.current?.play();
          if (playPromise) {
            playPromise.catch((error) => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
            });
          }
          setIsPlaying(true);
        } catch (error) {
          console.error("Play error:", error);
          setIsPlaying(false);
        }
      }
    },
    [fetchTrackData, setCurrentTrack, setIsPlaying]
  );

  useEffect(() => {
    if (window) {
      window.playTrackDirectly = playTrackDirectly;
    }
    return () => {
      if (window) {
        delete window.playTrackDirectly;
      }
    };
  }, [playTrackDirectly]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (queue.length > 0 && !currentTrack) {
      loadTrack(0);
    }
  }, [queue, currentTrack, loadTrack]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
        }
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error("PlayPause error:", error);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      loadTrack(currentIndex + 1);
    }
  };

  // Update progress based on actual audio time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(progressPercent) ? 0 : progressPercent);
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  const currentTrackInfo = urlPlay ?? { name: "No track selected" };
  const highQualityUrl =
    currentTrackInfo?.downloadUrl?.find((item) => item.quality === "320kbps")
      ?.url || "";

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
      {/* Track Info */}
      <div className="flex items-center space-x-3">
        {currentTrackInfo?.image?.[2]?.url ? (
          <img
            src={currentTrackInfo.image[2].url}
            className={`h-10 w-10 rounded-lg bg-gradient-to-b from-gray-700 to-gray-500 transition ${
              isPlaying ? "pulse-glow" : ""
            }`}
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-gradient-to-b from-gray-700 to-gray-500" />
        )}
        <div>
          <TrackInfo
            currentTrackInfo={currentTrackInfo}
            currentTrack={currentTrackInfo}
          />
        </div>
      </div>

      <audio ref={audioRef} src={highQualityUrl} preload="auto" autoPlay />

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <button
          className="text-gray-300 hover:text-white transition"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          className="bg-white text-black p-2 rounded-full hover:scale-105 transition"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        <button
          className="text-gray-300 hover:text-white transition"
          onClick={handleNext}
          disabled={currentIndex === queue.length - 1}
        >
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
          onChange={(e) => {
            const newVolume = parseInt(e.target.value) / 100;
            if (audioRef.current) audioRef.current.volume = newVolume;
            setVolume(parseInt(e.target.value));
          }}
          className="w-16 h-[4px] bg-gray-500 rounded-lg"
        />
      </div>

      {/* Progress Bar */}
      <div
        className={`absolute bottom-0 left-1 w-[calc(100%-7px)] h-1 bg-gray-700 rounded-b-2xl overflow-hidden 
        transition-opacity duration-500 ease-in-out transform 
        ${isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-0"}`}
      >
        <div
          className="h-full bg-blue-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Error Display */}
      {errorPlaying && (
        <div className="absolute top-0 left-0 w-full text-red-500 text-xs text-center -mt-6">
          {errorPlaying}
        </div>
      )}
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
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  return (
    <>
      {!isAuthPage && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-10"
        >
          <Header />
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />
          <Route
            path="/library"
            element={
              <PageTransition>
                <LibraryPage />
              </PageTransition>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
          <Route
            path="/signup"
            element={
              <PageTransition>
                <SignUp />
              </PageTransition>
            }
          />
          <Route
            path="/search/:query"
            element={
              <PageTransition>
                <SearchPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
      {!isAuthPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Player />
        </motion.div>
      )}
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
