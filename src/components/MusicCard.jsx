import React from 'react';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';

const MusicCard = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  const song = {
    title: "Dreams",
    artist: "Fleetwood Mac",
    albumArt: "/api/placeholder/200/200",
    duration: "4:14"
  };

  return (
    <div className="w-64 bg-gray-900 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-shadow duration-300">
      {/* Album Art */}
      <div className="relative group">
        <img 
          src={song.albumArt} 
          alt={`${song.title} album art`}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="transform scale-0 group-hover:scale-100 transition-transform duration-300 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 border border-gray-700"
          >
            {isPlaying ? 
              <Pause className="w-6 h-6 text-gray-100" /> : 
              <Play className="w-6 h-6 text-gray-100 ml-1" />
            }
          </button>
        </div>
      </div>

      {/* Song Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-gray-100 truncate">
              {song.title}
            </h3>
            <p className="text-gray-400 text-sm">
              {song.artist}
            </p>
          </div>
          <span className="text-sm text-gray-400">
            {song.duration}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors duration-200"
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : 'text-gray-400'}`}
            />
          </button>
          <button className="hover:bg-gray-800 p-2 rounded-full transition-colors duration-200">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicCard;