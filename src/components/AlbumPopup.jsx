import { motion } from "framer-motion";
import { X, Play, ListMusic, Clock, Heart } from "lucide-react";
import { auth, db, doc, setDoc, getDoc } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { useGlobalContext } from "../GlobalContext";
import { useNavigate } from "react-router-dom";
import { deleteDoc } from "firebase/firestore";

const AlbumPopup = ({ album, onClose }) => {
  const { setTrackList, setQueueState } = useGlobalContext();
  const [isFavorited, setIsFavorited] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  if (!album) return null;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User didn't login.");
        navigate("/login");
      } else {
        setUser(user);
        checkIfFavorited(user.uid, album.id) ? setIsFavorited(true) : setIsFavorited(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkIfFavorited = async (userId, itemId) => {
    if (!userId || !itemId) return false;

    try {
      const favoriteRef = doc(db, `users/${userId}/favorites`, itemId);
      const docSnap = await getDoc(favoriteRef);
      return docSnap.exists();
    }
    catch (err) {
      console.error('error in checking favorite status');
      return false;
    }
  };
  
  const toggleFavorite = async (id, type) => {
    if (!user) {
      console.log("User didn't login");
      return;
    }
    const favoriteRef = doc(db, `users/${user.uid}/favorites`, id);

    if (isFavorited) {
      await deleteDoc(favoriteRef);
      console.log(`Removed ${type} ${id} from favorites`);
    }
    else {
      await setDoc(favoriteRef, { id, type, timestamp: Date.now() });
      console.log(`Added ${type} ${id} to favorites`);
    }

    setIsFavorited((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePlay = () => {
    if (album.tracks?.items) {
      setQueueState(false);
      setTrackList(album.tracks.items.map((track) => track.name));
    }
    console.log("Playing album:", album.name);
  };

  const handleSinglePlay = (trackName) => {
    setQueueState(false);
    setTrackList([trackName]);
  };

  const handleQueue = () => {
    if (album.tracks?.items) {
      setQueueState(true);
      setTrackList(album.tracks.items.map((track) => track.name));
    }
    console.log("Adding album to queue:", album.name);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-zinc-900 text-zinc-100 rounded-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ maxWidth: "min(90vw, 768px)" }} // Ensures proper width constraint
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Section with Image and Main Info */}
        <div className="w-full md:w-2/5 bg-zinc-800 p-4 md:p-6 flex flex-col">
          <button
            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-700 rounded-full z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative mx-auto md:mx-0 mb-4 group">
            <img
              src={album.images?.[0]?.url}
              alt={album.name}
              className="w-36 h-36 md:w-full md:h-auto aspect-square rounded-xl shadow-lg object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                className="bg-white rounded-full p-2 md:p-3 shadow-lg"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 text-zinc-900 fill-zinc-900" />
              </motion.button>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold line-clamp-2">
              {album.name}
            </h2>
            <p className="text-zinc-300 mt-1 text-sm md:text-base">
              {album.artists?.map((a) => a.name).join(", ")}
            </p>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Released: {album.release_date}
            </p>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              {album.total_tracks} tracks
            </p>
          </div>

          <div className="mt-3 md:mt-4 flex items-center justify-center md:justify-start gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              className="flex items-center gap-1 md:gap-2 bg-white hover:bg-gray-200 text-zinc-900 font-medium py-1 md:py-2 px-3 md:px-4 rounded-lg transition-colors text-xs md:text-sm"
            >
              <Play className="w-3 h-3 md:w-4 md:h-4 fill-zinc-900" />
              <span>Play</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQueue}
              className="flex items-center gap-1 md:gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium py-1 md:py-2 px-3 md:px-4 rounded-lg transition-colors border border-zinc-600 text-xs md:text-sm"
            >
              <ListMusic className="w-3 h-3 md:w-4 md:h-4" />
              <span>Queue</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFavorite(album.id, 'album')}
              className={`p-1 md:p-2 rounded-full transition-colors ${
                isFavorited
                  ? "bg-red-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>

        {/* Right Section with Track List */}
        <div className="w-full md:w-3/5 bg-zinc-900 p-4 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3 md:mb-4 border-b border-zinc-700 pb-2">
            <h3 className="text-base md:text-lg font-semibold text-zinc-100">
              Tracks
            </h3>
            <div className="flex items-center gap-1 md:gap-2 text-zinc-400 text-xs md:text-sm mr-2 md:mr-10">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>{formatTotalDuration(album.tracks?.items)}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[30vh] md:max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
            <ul className="space-y-1">
              {album.tracks?.items?.map((track, index) => (
                <motion.li
                  key={track.id || index}
                  whileHover={{ backgroundColor: "rgba(63, 63, 70, 0.6)" }}
                  className="flex justify-between items-center text-xs md:text-sm p-2 md:p-3 rounded-lg cursor-pointer group"
                  onClick={() => handleSinglePlay(track.name)}
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <span className="text-zinc-500 w-4 md:w-5 text-right font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-200 font-medium line-clamp-1 block">
                        {track.name}
                      </span>
                      {track.artists && (
                        <span className="text-zinc-400 text-xs line-clamp-1 block">
                          {track.artists.map((a) => a.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-zinc-400 text-xs">
                      {formatDuration(track.duration_ms)}
                    </span>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="ml-1 md:ml-2 p-1 rounded-full hover:bg-zinc-700 text-zinc-300 opacity-0 group-hover:opacity-100"
                    >
                      <Play className="w-3 h-3 fill-zinc-300" />
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, "0")}`;
};

const formatTotalDuration = (tracks) => {
  if (!tracks || !tracks.length) return "0:00";

  const totalMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  }

  return `${minutes} min ${seconds} sec`;
};

export default AlbumPopup;
