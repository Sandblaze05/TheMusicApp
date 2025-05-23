import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { auth, db, doc, setDoc, getDoc } from "../firebase/firebase";
import {
  arrayUnion,
  collection,
  deleteDoc,
  getDocs,
  increment,
  updateDoc,
} from "firebase/firestore";
import {
  X,
  Plus,
  Music,
  Search,
  MoreVertical,
  Play,
  Clock,
  Trash,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useGlobalContext } from "../GlobalContext";

const CreatePlaylist = ({ onClose, onCurrent }) => {
  const { setTrackList, setQueueState } = useGlobalContext();

  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistId, setPlaylistId] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handlePlay = (tracks) => {
    if (tracks) {
      setQueueState(false);
      setTrackList(tracks);
    }
    console.log("Playing playlist");
  };

  const handleCreatePlaylist = async () => {
    if (!user?.uid || !newPlaylistName.trim()) return;

    const newPlaylist = {
      id: `${user?.uid}${Date.now()}`,
      name: newPlaylistName,
      description: newPlaylistDescription,
      imageUrl: "/api/placeholder/120/120",
      owner: user?.uid,
      tracks: [],
      createdAt: new Date().toISOString(),
    };

    const playlistRef = doc(db, `users/${user?.uid}/playlists`, newPlaylist.id);

    try {
      await setDoc(playlistRef, newPlaylist);
      console.log("Playlist created successfully");
      setPlaylists([newPlaylist, ...playlists]);
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setIsCreatingPlaylist(false);
    }
  };

  const addToPlaylist = async (Id, trackName) => {
    if (!user?.uid || !Id) return;
    const playlistRef = doc(db, `users/${user?.uid}/playlists`, Id);
    try {
      await updateDoc(playlistRef, {
        tracks: arrayUnion(trackName),
      });
      console.log("Track: ", trackName, "added to playlist: ", Id);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    } finally {
      setPlaylistId(null);
      onClose();
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistId) return;
    const playlistRef = doc(db, `users/${user?.uid}/playlists`, playlistId);
    try {
      await deleteDoc(playlistRef);
      console.log("Playlist deleted successfully");
      setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error deleting playlist:", error);
    } finally {
      setPlaylistId(null);
    }
  };

  const fetchPlaylists = async (uid) => {
    if (!uid) return;
    console.log("Fetching playlists for user:", uid);
    try {
      const playlistsRef = collection(db, `users/${uid}/playlists`);
      const snapshot = await getDocs(playlistsRef);
      const playlists = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Playlists fetched successfully:", playlists);
      setPlaylists(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]);
    }
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours} hr ${remainingMinutes} min`;
    }
    return `${minutes} min`;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User didn't login.");
        navigate("/login");
      } else {
        // console.log("User logged in:", user);
        setUser(user);
        fetchPlaylists(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 min-h-screen"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-zinc-900 text-zinc-100 rounded-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxWidth: "min(90vw, 768px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-800 p-4 md:p-6 flex justify-between items-center border-b border-zinc-700">
          <h2 className="text-xl md:text-2xl font-bold">
            Add To Your Playlists
          </h2>
          <motion.button
            className="text-zinc-400 hover:text-zinc-100 p-2 hover:bg-zinc-700 rounded-full"
            onClick={onClose}
            aria-label="Close"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search and Create */}
        <div className="p-4 md:p-6 border-b border-zinc-700 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingPlaylist(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-zinc-900 font-medium py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </motion.button>
        </div>

        {/* Create Playlist Form */}
        {isCreatingPlaylist && (
          <div className="p-4 md:p-6 border-b border-zinc-700 bg-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-zinc-300 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-zinc-700 text-zinc-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  placeholder="My Awesome Playlist"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-1 block">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full bg-zinc-700 text-zinc-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none h-20"
                  placeholder="What's this playlist about?"
                />
              </div>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className={`font-medium py-2 px-4 rounded-lg text-sm ${
                    newPlaylistName.trim()
                      ? "bg-white hover:bg-gray-200 text-zinc-900"
                      : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  Create
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {filteredPlaylists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
              <Music className="w-8 h-8 mb-2" />
              <p>No playlists found</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaylists.map((playlist) => (
                <motion.li
                  key={playlist.id}
                  whileHover={{ backgroundColor: "rgba(63, 63, 70, 0.6)" }}
                  className="flex gap-3 p-3 rounded-lg cursor-pointer group border border-zinc-800 hover:border-zinc-600"
                  onClick={() => addToPlaylist(playlist.id, onCurrent.name)}
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img
                      src={playlist.imageUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover rounded-md shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white rounded-full p-2 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(playlist.tracks);
                        }}
                      >
                        <Play className="w-4 h-4 text-zinc-900 fill-zinc-900" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-zinc-100 line-clamp-1 hover:underline hover:decoration-white/60">
                        {playlist.name}
                      </h3>
                      <button className="text-zinc-400 hover:text-zinc-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Trash
                          className="w-4 h-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDialogOpen((prev) => !prev);
                            setPlaylistId(playlist.id);
                          }}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {playlist.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <span>•</span>
                      <span>{playlist.tracks.length} tracks</span>
                      <span>•</span>
                      {/* {<span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(playlist.duration)}
                      </span>} */}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
      {confirmDialogOpen ? (
        <ConfirmDialog
          onClose={() => setConfirmDialogOpen((prev) => !prev)}
          onConfirm={handleDeletePlaylist}
        />
      ) : null}
    </div>
  );
};

export default CreatePlaylist;
