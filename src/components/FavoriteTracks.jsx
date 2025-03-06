import React, { useState, useEffect } from "react";
import { Heart, Music2, User2, Play, Clock } from "lucide-react";
import { useGlobalContext } from "../GlobalContext";
import { useNavigate } from "react-router-dom";
import { auth, db, doc, setDoc, getDoc } from "../firebase/firebase";
import { deleteDoc } from "firebase/firestore";

const FavoriteTracks = ({ tracks, loading }) => {
  const [favorites, setFavorites] = useState([]);
  const [isFavorited, setIsFavorited] = useState({});
  const [selectedTrack, setSelectedTrack] = useState(null);
  const { isPlaying, setIsPlaying } = useGlobalContext();
  const { setQueueState, setTrackList } = useGlobalContext();
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const checkIfFavorited = async (id) => {
    if (!user) return;
    const favoriteRef = doc(db, `users/${user.uid}/favorites`, id);
    const docSnap = await getDoc(favoriteRef);
    return docSnap.exists();
  };

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

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayTrack = (trackName) => {
    setQueueState(false);
    setTrackList([trackName]);
  };

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

  useEffect(() => {
    if (tracks) {
      setFavorites(tracks.filter((track) => track.isFavorite || true));
    }
  }, [tracks]);

  useEffect(() => {
    if (user && tracks.length > 0) {
      const fetchFavorites = async () => {
        const favoritesState = {};
        for (const track of tracks) {
          const isFav = await checkIfFavorited(track.id);
          favoritesState[track.id] = isFav;
        }
        setIsFavorited(favoritesState);
      };
      fetchFavorites();
    }
  }, [user, tracks]);

  return (
    <div className="p-4 w-full">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center p-3 rounded-lg bg-zinc-800/30 animate-pulse"
            >
              <div className="w-12 h-12 bg-zinc-700 rounded mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 backdrop-blur-sm border border-zinc-800/50">
          <Heart className="w-12 h-12 mb-4 text-zinc-500 stroke-1.5" />
          <p className="text-zinc-400 text-sm mb-2">No favorite tracks yet</p>
          <p className="text-zinc-500 text-xs">Tracks you ♥ will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.slice(0, 9).map((track, index) => (
              <div
                key={track.id || index}
                className={`group flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-zinc-800/50 ${
                  selectedTrack?.id === track.id
                    ? "bg-zinc-800/70 border border-zinc-700/50"
                    : "bg-zinc-900/40"
                }`}
              >
                <div className="relative mr-4">
                  {track.album?.images?.[0]?.url ? (
                    <div className="w-12 h-12 rounded overflow-hidden shadow-lg">
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}
                  <button
                    onClick={() => handlePlayTrack(track.name)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-6 h-6 text-white fill-white" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {track.name}
                  </h3>
                  <div className="flex items-center gap-1 text-zinc-400 mt-1">
                    <User2 className="w-3 h-3" />
                    <span className="text-xs truncate">
                      {track.artists?.map((artist) => artist.name).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="p-2 rounded-full hover:bg-zinc-700/50 transition-colors">
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorited[track.id]
                          ? "text-rose-500 fill-rose-500"
                          : "text-zinc-400"
                      }`}
                      onClick={() => toggleFavorite(track.id, "Track")}
                    />
                  </button>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {formatDuration(track.duration_ms || 180000)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {favorites.length > 9 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-zinc-400">
                  More Favorites
                </h3>
                <button className="text-xs text-zinc-500 hover:text-white transition-colors">
                  View All
                </button>
              </div>
              <div className="flex overflow-x-auto pb-4 space-x-3 scrollbar-hide">
                {favorites.slice(9).map((track, index) => (
                  <div
                    key={track.id || `more-${index}`}
                    className={`group flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-zinc-800/50 flex-shrink-0 w-64 ${
                      selectedTrack?.id === track.id
                        ? "bg-zinc-800/70 border border-zinc-700/50"
                        : "bg-zinc-900/40"
                    }`}
                  >
                    <div className="relative mr-4">
                      {track.album?.images?.[0]?.url ? (
                        <div className="w-12 h-12 rounded overflow-hidden shadow-lg">
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
                          <Music2 className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                      <button
                        onClick={() => handlePlayTrack(track.name)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-6 h-6 text-white fill-white" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {track.name}
                      </h3>
                      <div className="flex items-center gap-1 text-zinc-400 mt-1">
                        <User2 className="w-3 h-3" />
                        <span className="text-xs truncate">
                          {track.artists
                            ?.map((artist) => artist.name)
                            .join(", ")}
                        </span>
                      </div>
                    </div>

                    <button className="p-2 rounded-full hover:bg-zinc-700/50 transition-colors">
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorited[track.id]
                            ? "text-rose-500 fill-rose-500"
                            : "text-zinc-400"
                        }`}
                        onClick={() => toggleFavorite(track.id, "Track")}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 p-4 flex items-center">
          <div className="w-12 h-12 rounded overflow-hidden mr-4">
            <img
              src={
                selectedTrack.album?.images?.[0]?.url ||
                "/api/placeholder/48/48"
              }
              alt={selectedTrack.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">
              {selectedTrack.name}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {selectedTrack.artists?.map((artist) => artist.name).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-green-500 text-black hover:bg-green-400 transition-colors"
            >
              {navigator.mediaSession.playbackState === "playing" ? (
                <span className="w-5 h-5 flex items-center justify-center">
                  II
                </span>
              ) : (
                <Play className="w-5 h-5 fill-black" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteTracks;
