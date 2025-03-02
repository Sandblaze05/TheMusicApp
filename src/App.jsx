import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Library, Search, User, Settings, LogOut } from "lucide-react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { Grip, GripVertical } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import LibraryPage from "./pages/Library";
import { useDebounce } from "react-use";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TrackInfo from "./components/TrackInfo";
import { auth, db, doc, setDoc, getDoc } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, hover, motion } from "framer-motion";
import { useGlobalContext } from "./GlobalContext";
import SearchPage from "./pages/SearchPage";
import SeekableProgressBar from "./components/SeekableProgressBar";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
    if (e.key === "Enter" && searchQuery !== "") {
      navigate(`/search/${searchQuery}`);
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
    <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 rounded-b-2xl shadow-lg max-w-screen">
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
          <DropdownMenu.Trigger className="focus:outline-none mr-3">
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
  const { queueState, setQueueState } = useGlobalContext();
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const queueRef = useRef(null);

  // Local states
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const saveCurrentQueue = async (userId, currentQueue, currentIndex) => {
    if (!userId || !initialLoadComplete) {
      return;
    }
    if (currentQueue && currentQueue.length > 0) {
      await setDoc(
        doc(db, "users", userId),
        { savedQueue: currentQueue, savedIndex: currentIndex },
        { merge: true }
      );
    }
  };

  const getSavedQueue = async (userId) => {
    if (!userId) {
      return [];
    }
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists()
      ? {
          queue: userDoc.data().savedQueue || [],
          index:
            userDoc.data().savedIndex !== undefined
              ? userDoc.data().savedIndex
              : 0,
        }
      : { queue: [], index: 0 };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const saved = await getSavedQueue(user.uid);
        if (saved.queue.length > 0) {
          setQueue(saved.queue);
          setCurrentIndex(saved.index);
        }
        setInitialLoadComplete(true); // Mark initial load as complete after fetching saved queue
      } else {
        setUser(null);
        setCurrentIndex(0);
        setQueue([]);
        setInitialLoadComplete(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && initialLoadComplete) {
      // Only save if initial load is complete
      saveCurrentQueue(user.uid, queue, currentIndex);
    }
  }, [queue, user, initialLoadComplete, currentIndex]);

  // Add event listeners to sync audio state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
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

  // browser navigator api
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack || !urlPlay) {
      return;
    }
    const artwork = [];
    if (urlPlay?.image?.[2]?.url) {
      artwork.push({
        src: urlPlay.image[2].url,
        sizes: "96x96",
        type: "image/jpeg",
      });
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack || "Unknown Track",
      artist:
        urlPlay?.artists?.primary?.map((artist) => artist.name).join(", ") ||
        "Unknown Artist",
      album: urlPlay?.album?.name || "Unknown Album",
      artwork: artwork.length
        ? artwork
        : [{ src: "/default-cover.jpg", sizes: "96x96", type: "image/jpeg" }],
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch((e) => console.error("Play failed: ", e));
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
    navigator.mediaSession.setActionHandler("nexttrack", handleNext);
  }, [currentTrack, urlPlay, isPlaying]);

  // update the page title when the current track changes
  useEffect(() => {
    if (currentTrack && urlPlay) {
      const artistName =
        urlPlay?.artists?.primary?.map((artist) => artist.name).join(", ") ||
        "Unknown Artist";

      if (isPlaying) {
        document.title = `♫ ${currentTrack} - ${artistName}`;
      } else {
        document.title = `▶ ${currentTrack} - ${artistName}`;
      }

      return () => {
        document.title = "Boomify";
      };
    }
  }, [currentTrack, urlPlay, isPlaying]);

  // Update queue when trackList changes
  useEffect(() => {
    if (trackList.length > 0) {
      if (queueState) {
        // Append to existing queue
        setQueue((prevQueue) => [...prevQueue, ...trackList]);
      } else {
        // Override queue and reset current index
        setQueue(trackList);
        setCurrentIndex(0);
        // Force reload of first track in new queue
        loadTrack(0, trackList);
      }
      setTrackList([]);
    }
  }, [trackList, queueState, setTrackList]);

  const fetchTrackData = useCallback(
    async (trackName) => {
      console.log("fetching...");
      try {
        const response = await fetch(
          `https://music-fetch-jiosaavn.vercel.app/api/search/songs?query=${trackName}&limit=1`
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
    async (index, queueToUse = queue) => {
      if (index >= 0 && index < queueToUse.length) {
        console.log("loadtrack");
        const trackName = queueToUse[index];
        const trackData = await fetchTrackData(trackName);

        if (trackData) {
          setCurrentTrack(trackName);
          setCurrentIndex(index);

          try {
            if (audioRef.current) {
              const playPromise = audioRef.current.play();
              if (playPromise) {
                console.log("Attempting to play next");
                playPromise.catch((error) => {
                  console.error("Playback failed:", error);
                  setIsPlaying(false);
                });
              }
            }
          } catch (error) {
            console.error("Play error:", error);
            setIsPlaying(false);
          }
        }
      }
    },
    [queue, fetchTrackData, setCurrentTrack, setIsPlaying]
  );

  const playTrackDirectly = useCallback(
    async (trackName) => {
      setQueueState(false);
      // setQueue([]);
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
    if (queue.length > 0 && !currentTrack && !currentIndex) {
      loadTrack(0);
    } else if (currentIndex && queue.length > currentIndex) {
      loadTrack(currentIndex);
    }
  }, [queue, currentTrack, loadTrack]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
          setIsPlaying(true);
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        }
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
      }
    } catch (error) {
      console.error("PlayPause error:", error);
      setIsPlaying(false);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
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

  const handleSeek = (newProgress) => {
    if (audioRef.current) {
      audioRef.current.currentTime =
        (audioRef.current.duration * newProgress) / 100;
    }
    setProgress(newProgress);
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

  // Handle player click to show queue
  const handlePlayerClick = (e) => {
    // Don't show queue if clicking on buttons or controls
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.tagName === "INPUT"
    ) {
      return;
    }

    setShowQueue(true);
  };

  // Handle clicks outside the queue overlay to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showQueue &&
        queueRef.current &&
        !queueRef.current.contains(e.target) &&
        !playerRef.current.contains(e.target)
      ) {
        setShowQueue(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showQueue]);

  // Function to change track from queue
  const changeTrack = (index) => {
    loadTrack(index);
    setShowQueue(false);
  };

  // DND-Kit functions for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = active.id;
      const newIndex = over.id;

      setQueue((items) => {
        const newArray = [...items];
        const [removed] = newArray.splice(oldIndex, 1);
        newArray.splice(newIndex, 0, removed);

        // Update currentIndex if the currently playing track was moved
        if (currentIndex === oldIndex) {
          setCurrentIndex(newIndex);
        } else if (currentIndex > oldIndex && currentIndex <= newIndex) {
          setCurrentIndex(currentIndex - 1);
        } else if (currentIndex < oldIndex && currentIndex >= newIndex) {
          setCurrentIndex(currentIndex + 1);
        }

        return newArray;
      });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const currentTrackInfo = urlPlay ?? { name: "No track selected" };
  const highQualityUrl =
    currentTrackInfo?.downloadUrl?.find((item) => item.quality === "320kbps")
      ?.url || "";

  return (
    <>
      {/* Main Player with Integrated Queue */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg">
        {/* Queue Overlay */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              ref={queueRef}
              initial={{ y: "100%", opacity: 0, height: 0 }}
              animate={{ y: 0, opacity: 1, height: "auto" }}
              exit={{ y: "100%", opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-full bg-gray-950/80 backdrop-blur-lg rounded-t-xl shadow-lg flex flex-col overflow-hidden max-h-[60vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Queue Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h3 className="font-bold text-xl text-white">Playing Queue</h3>
                <div className="flex items-center">
                  <Grip className="h-5 w-5 text-gray-400 mr-3" />
                  <button
                    onClick={() => setShowQueue(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Queue List */}
              <motion.div
                className="flex-1 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ transform: "none" }}
              >
                {queue.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                    modifiers={[restrictToFirstScrollableAncestor]}
                  >
                    <SortableContext
                      items={queue.map((_, index) => index)}
                      strategy={verticalListSortingStrategy}
                    >
                      {queue.map((trackName, index) => (
                        <SortableTrackItem
                          key={index}
                          id={index}
                          trackName={trackName}
                          index={index}
                          currentIndex={currentIndex}
                          urlPlay={urlPlay}
                          isPlaying={isPlaying}
                          changeTrack={changeTrack}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <p>Your queue is empty</p>
                    <p className="text-sm mt-2">Search and add songs to play</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Player */}
        <div
          ref={playerRef}
          onClick={handlePlayerClick}
          className={`w-full bg-gray-950/80 backdrop-blur-lg shadow-lg flex items-center justify-between px-4 py-3 cursor-pointer ${
            showQueue ? "rounded-b-2xl" : "rounded-2xl"
          }`}
        >
          {/* Track Info */}
          <div className="flex items-center space-x-3 min-w-0">
            {currentTrackInfo?.image?.[2]?.url ? (
              <img
                src={currentTrackInfo.image[2].url}
                className={`h-10 w-10 rounded-lg bg-gradient-to-b from-gray-700 to-gray-500 transition ${
                  isPlaying ? "pulse-glow" : ""
                }`}
                alt="Track artwork"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-b from-gray-700 to-gray-500" />
            )}
            <div className="min-w-0 flex-shrink">
              <TrackInfo
                currentTrackInfo={currentTrackInfo}
                currentTrack={currentTrack}
              />
            </div>
          </div>

          <audio ref={audioRef} src={highQualityUrl} preload="auto" autoPlay />

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Previous Button */}
            <motion.button
              className="text-gray-300 hover:text-white transition"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              whileTap={{ x: -5 }} // Moves left slightly
              whileHover={{ scale: 1.1 }}
              animate={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
            >
              <SkipBack className="h-5 w-5" />
            </motion.button>

            {/* Play/Pause Button */}
            <motion.button
              className="bg-white text-black p-2 rounded-full transition"
              onClick={handlePlayPause}
              whileTap={{ scale: 0.75 }} // Shrink on press
              animate={{ scale: 1 }} // Default scale
              whileHover={{ scale: 1.1 }} // Slight bounce after release
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </motion.button>

            {/* Next Button */}
            <motion.button
              className="text-gray-300 hover:text-white transition"
              onClick={handleNext}
              disabled={currentIndex === queue.length - 1}
              whileTap={{ x: 5 }} // Moves right slightly
              whileHover={{ scale: 1.1 }}
              animate={{ opacity: currentIndex === queue.length - 1 ? 0.5 : 1 }}
            >
              <SkipForward className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Volume - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2">
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
          <SeekableProgressBar
            progress={progress}
            onSeek={handleSeek}
            currentTime={audioRef.current?.currentTime}
            duration={audioRef.current?.duration}
          />

          {/* Error Display */}
          {errorPlaying && (
            <div className="absolute top-0 left-0 w-full text-red-500 text-xs text-center -mt-6">
              {errorPlaying}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// SortableTrackItem component for drag and drop
const SortableTrackItem = ({
  id,
  trackName,
  index,
  currentIndex,
  urlPlay,
  isPlaying,
  changeTrack,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.3 : 1, // Make original item more transparent while dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 px-6 py-3 hover:bg-gray-800 transition ${
        index === currentIndex ? "bg-gray-800/50" : ""
      } ${isDragging ? "bg-gray-700/30" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="text-gray-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Track Index */}
      <div className="text-sm text-gray-400 w-6 text-center">{index + 1}</div>

      {/* Track Image or Play Icon */}
      {index === currentIndex && urlPlay?.image?.[2]?.url ? (
        <img
          src={urlPlay.image[2].url}
          className={`h-10 w-10 rounded bg-gray-700 transition-all ${
            isPlaying ? "shadow-lg shadow-blue-500/50" : ""
          }`}
          alt="Track artwork"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center">
          <Play className="h-4 w-4 text-gray-500" />
        </div>
      )}

      {/* Track Name */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => !isDragging && changeTrack(index)}
      >
        <div className="text-white font-medium truncate">{trackName}</div>
        {index === currentIndex && (
          <div className="text-blue-400 text-sm">
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
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
