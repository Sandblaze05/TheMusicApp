import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, doc, setDoc, getDoc } from "../firebase/firebase";
import { deleteDoc } from "firebase/firestore";
import { useGlobalContext } from "../GlobalContext";
import { Play, Clock, Music, List, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AlbumPopup from "../components/AlbumPopup";

const SearchPage = () => {
  const { query } = useParams();
  const { token, setToken } = useGlobalContext();
  const { setTrackList, setQueueState } = useGlobalContext();
  const [user, setUser] = useState(null);
  const [result, setResult] = useState([]);
  const stableResult = useMemo(() => result, [result]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [albumContent, setAlbumContent] = useState(null);
  const navigate = useNavigate();

  const handleSinglePlay = (trackName) => {
    setQueueState(false);
    setTrackList([trackName]);
  };

  const handleAddToQueue = (trackName) => {
    setQueueState(true);
    setTrackList([trackName]);
  };

  const spotifyToken = async () => {
    console.log("Getting token");

    const storedToken = localStorage.getItem("spotify_token");
    const storedExpiry = localStorage.getItem("spotify_token_expiry");

    // Check if token is still valid
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      console.log("Using stored token");
      setToken(storedToken);
      console.log(storedToken);
      return;
    }

    const authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          btoa(
            import.meta.env.VITE_CLIENT_ID +
              ":" +
              import.meta.env.VITE_CLIENT_SECRET
          ),
      },
      body: "grant_type=client_credentials",
    };

    try {
      const response = await fetch(
        "https://accounts.spotify.com/api/token",
        authOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to get token: ${response.status} ${response.statusText} - ${data.error}`
        );
      }

      console.log("New token received");
      setToken(data.access_token);

      // Store token and expiry (token expires in 3600 seconds = 1 hour)
      localStorage.setItem("spotify_token", data.access_token);
      localStorage.setItem(
        "spotify_token_expiry",
        Date.now() + data.expires_in * 1000
      );
    } catch (err) {
      console.error("Token fetch failed:", err.message);
      setError(`Token fetch failed: ${err.message}`);
      setToken(null);
    }
  };

  const fetchQuery = async (overrideToken = null) => {
    console.log(token);
    setLoading(true);
    try {
      const authOptions = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${overrideToken || token}`,
        },
      };
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album%2Cplaylist%2Ctrack&market=IN`,
        authOptions
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      console.log(data);
      setResult(data);
    } catch (err) {
      setError(`Error in search: ${err}`);
      console.log(err);
    } finally {
      setLoading(false);
      setError("");
    }
  };

  const getContent = async (fetchURL) => {
    try {
      if (fetchURL !== "") {
        const authOptions = {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await fetch(`${fetchURL}`, authOptions);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Failed to get album data: ${response.status}`);
        }
        console.log(data);
        setAlbumContent(data);
      }
    } catch (err) {
      const msg = `Album content fetch failed: ${err.message}`;
      console.log(msg);
      setError(msg);
      setAlbumContent(null);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const sequence = async () => {
        await spotifyToken();
        fetchQuery();
    };
    sequence();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User didn't login.");
        navigate("/login");
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Tracks Section
  const TracksSection = () => {
    const [isFavorited, setIsFavorited] = useState({});

    const checkIfFavorited = async (id) => {
      if (!user) return;
      const favoriteRef = doc(db, `users/${user.uid}/favorites`, id);
      const docSnap = await getDoc(favoriteRef);
      return docSnap.exists();
    };

    // Load initial favorite states for all tracks
    useEffect(() => {
      if (stableResult?.tracks?.items.length > 0 && user) {
        const fetchFavorites = async () => {
          const favoritesState = {};
          for (const track of stableResult.tracks.items) {
            const isFav = await checkIfFavorited(track.id);
            favoritesState[track.id] = isFav;
          }
          setIsFavorited(favoritesState);
        };
        fetchFavorites();
      }
    }, [stableResult, user]);

    const toggleFavorite = async (id, type) => {
      if (!user) {
        console.log("User didn't login");
        return;
      }
      const favoriteRef = doc(db, `users/${user.uid}/favorites`, id);

      try {
        if (isFavorited[id]) {
          await deleteDoc(favoriteRef);
          console.log(`Removed ${type} ${id} from favorites`);
        } else {
          await setDoc(favoriteRef, { id, type, timestamp: Date.now() });
          console.log(`Added ${type} ${id} to favorites`);
        }

        // Update state correctly by tracking each item separately
        setIsFavorited((prev) => ({
          ...prev,
          [id]: !prev[id],
        }));
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    };

    if (!stableResult?.tracks?.items?.length) return null;

    return (
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="py-4 px-0 w-fit text-3xl font-bold text-gray-100 hover:text-white glow"
        >
          | Songs
        </motion.div>
    
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg overflow-hidden">
          <AnimatePresence>
            {stableResult.tracks.items.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }} // Staggered animation
                className="group flex items-center gap-4 p-3 hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-700/50 last:border-0"
                onClick={() => handleSinglePlay(track.name)}
              >
                <div className="w-12 h-12 relative flex-shrink-0">
                  <img
                    src={track.album?.images[0]?.url}
                    alt={track.name}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                </div>
    
                <div className="flex-grow min-w-0">
                  <p className="text-white truncate">{track.name}</p>
                  <p className="text-gray-400 text-sm truncate">
                    {track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
    
                {/* Buttons */}
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToQueue(track.name);
                    }}
                    className="p-2 rounded-3xl hover:bg-gray-600 transition-colors"
                  >
                    <List className="h-5 w-5 text-gray-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2 rounded-3xl hover:bg-gray-600 transition-colors"
                  >
                    <Heart
                      onClick={() => toggleFavorite(track.id, "Track")}
                      className={`h-5 w-5 ${
                        isFavorited[track.id]
                          ? "fill-red-600 text-red-600"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                </div>
    
                <div className="text-gray-400 text-sm flex-shrink-0">
                  {formatDuration(track.duration_ms)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Artists Section
  const ArtistsSection = () => {
    if (!result?.artists?.items?.length) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {result.artists.items.map((artist) => (
            <div
              key={artist.id}
              className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-lg hover:bg-gray-700/50 transition-all duration-300 group relative"
            >
              <div className="relative aspect-square mb-3 overflow-hidden rounded-full">
                <img
                  src={artist.images[0]?.url}
                  alt={artist.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-white font-semibold truncate">
                  {artist.name}
                </h3>
                <p className="text-gray-400 text-sm truncate">
                  {artist.genres?.slice(0, 2).join(" • ")}
                </p>
              </div>

              <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Albums Section
  const AlbumsSection = () => {
    if (!stableResult?.albums?.items?.length) return null;

    return (
      <div className="mb-8">
        {/* {<h2 className="text-xl font-bold text-white mb-4">Albums</h2>} */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className=" py-4 px-0 w-fit text-3xl font-bold text-gray-100 hover:text-white glow"
        >
          | Albums
        </motion.div>

        {/* Container with overflow handling */}
        <div className="relative -mx-4 px-4">
          {/* Overflow container */}
          <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
            {/* Fixed width items in a flex row on mobile, grid on larger screens */}
            <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-4 min-w-max md:min-w-0">
              {stableResult.albums.items.map((album) => (
                <div
                  key={album.id}
                  className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-lg hover:bg-gray-700/50 transition-all duration-300 group relative w-36 flex-shrink-0 md:w-auto"
                  onClick={() => getContent(album.href)}
                >
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                    <img
                      src={album.images[0]?.url}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold truncate">
                      {album.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {album.artists?.map((a) => a.name).join(", ")}
                    </p>
                  </div>

                  <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8 mb-15">
        <TracksSection />
        <AlbumsSection />
        {albumContent && (
          <AlbumPopup
            album={albumContent}
            onClose={() => setAlbumContent(null)}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
