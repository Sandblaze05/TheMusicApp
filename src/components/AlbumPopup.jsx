import { motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useGlobalContext } from "../GlobalContext";

const AlbumPopup = ({ album, onClose }) => {
  const { trackList, setTrackList } = useGlobalContext();
  const { errorPlaying, setErrorPlaying } = useGlobalContext();
  const { urlPlay, setUrlPlay } = useGlobalContext();
  const { currentTrack, setCurrentTrack } = useGlobalContext();
  const { queueState, setQueueState } = useGlobalContext();
  
  if (!album) return null;
  
  // useEffect(() => {
  //   if(album.tracks?.items) {
  //     setTrackList(album.tracks.items.map((track) => track.name));
  //   }
  // }, [album]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePlay = () => {
    if(album.tracks?.items) {
      setQueueState(false);
      setTrackList(album.tracks.items.map((track) => track.name));
    }
    console.log('Playing album:', album.name);
    // setTimeout(() => getLink(), 1000);
  };

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
          <div className="relative group">
            <img
              src={album.images?.[0]?.url}
              alt={album.name}
              className="w-[150px] h-[150px] rounded-md"
            />
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
            >
              <Play className="w-12 h-12 text-white fill-white" />
            </button>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{album.name}</h2>
            <p className="text-zinc-400">{album.artists?.map(a => a.name).join(", ")}</p>
            <p className="text-sm text-zinc-500">{album.release_date}</p>
            <button
              onClick={handlePlay}
              className="mt-2 flex items-center gap-2 bg-white hover:bg-gray-300 text-black font-semibold py-2 px-4 rounded-full w-fit"
            >
              <Play className="w-4 h-4 fill-black" />
            </button>
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