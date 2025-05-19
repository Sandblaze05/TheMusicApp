import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, db, doc, setDoc, getDoc } from "../firebase/firebase";
import { deleteDoc } from "firebase/firestore";
import { X, Plus, Music, Search, MoreVertical, Play, Clock } from "lucide-react";

export default function CreatePlaylist({ onClose, onCurrent }) {
  const [user, setUser] = useState(null);
  
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
  });

  const [playlists, setPlaylists] = useState([]);
    // {
    //   id: "1",
    //   name: "My Favorite Tracks",
    //   description: "All my top tracks in one place",
    //   imageUrl: "/api/placeholder/120/120",
    //   owner: "Your Account",
    //   trackCount: 42,
    //   duration: 9360000, // in ms (2 hours 36 min)
    // },
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: `${user?.uid}${Date.now()}`,
      name: newPlaylistName,
      description: newPlaylistDescription,
      imageUrl: "/api/placeholder/120/120",
      owner: user?.uid,
      trackCount: 0,
      duration: 0,
    };
    
    
    const playlistRef = doc(db, `users/${user?.uid}/playlists`, newPlaylist.id);
    
    try {
      // await setDoc(playlistRef, newPlaylist);
      // console.log("Playlist created successfully");
      setPlaylists([newPlaylist, ...playlists]);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
    finally {
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setIsCreatingPlaylist(false);
    }

  };
  
  const filteredPlaylists = playlists.filter(playlist => 
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
    console.log("Track:", onCurrent);
  })

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
        className="relative bg-zinc-900 text-zinc-100 rounded-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxWidth: "min(90vw, 768px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-800 p-4 md:p-6 flex justify-between items-center border-b border-zinc-700">
          <h2 className="text-xl md:text-2xl font-bold">Your Playlists</h2>
          <button
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-700 rounded-full"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
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
                <label className="text-sm text-zinc-300 mb-1 block">Description (optional)</label>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-h-[60vh]">
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
                  className="flex gap-3 p-3 rounded-lg cursor-pointer group"
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
                      >
                        <Play className="w-4 h-4 text-zinc-900 fill-zinc-900" />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-zinc-100 line-clamp-1">{playlist.name}</h3>
                      <button className="text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{playlist.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <span>•</span>
                      <span>{playlist.trackCount} tracks</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(playlist.duration)}
                      </span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}