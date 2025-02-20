import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

const AlbumPopup = ({ album, onClose }) => {
  if (!album) return null;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="relative bg-zinc-900 text-white rounded-lg shadow-[0_0_10px_rgb(255,255,255,0.8)] max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="absolute top-3 right-3 text-zinc-400 hover:text-white" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        {/* Album Info */}
        <div className="flex gap-4">
          <img
            src={album.images?.[0]?.url}
            alt={album.name}
            className="w-24 h-24 rounded-md"
          />
          <div>
            <h2 className="text-xl font-bold">{album.name}</h2>
            <p className="text-zinc-400">{album.artists?.map(a => a.name).join(", ")}</p>
            <p className="text-sm text-zinc-500">{album.release_date}</p>
          </div>
        </div>

        {/* Track List */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Tracks</h3>
          <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
            {album.tracks?.items?.map((track, index) => (
              <li key={track.id || index} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-zinc-800">
                <span>{index + 1}. {track.name}</span>
                <span className="text-zinc-400 text-xs">
                  {formatDuration(track.duration_ms)}
                </span>
              </li>
            ))}
          </ul>
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

export default AlbumPopup;
