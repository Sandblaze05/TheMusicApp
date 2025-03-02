import React, { useState } from "react";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import { Music2, User2 } from "lucide-react";
import AlbumPopup from "./AlbumPopup";

const AlbumGridFav = ({ albums, loading, token }) => {
  const [albumContent, setAlbumContent] = useState(null);
  const [error, setError] = useState("");
  const [albumLoading, setAlbumLoading] = useState(false);

  const getContent = async (fetchURL) => {
    setAlbumLoading(true);
    try {
      if (!fetchURL) return;
      const response = await fetch(fetchURL, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to get album data: ${response.status}`);
      }

      const data = await response.json();
      setAlbumContent(data);
    } catch (err) {
      setError(`Album content fetch failed: ${err.message}`);
      setAlbumContent(null);
    } finally {
      setAlbumLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex overflow-x-auto scrollbar-hide space-x-4 p-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="relative rounded-md overflow-hidden w-[250px] flex-shrink-0"
            >
              <div className="w-full aspect-square bg-zinc-800 animate-pulse"></div>
              <div className="p-2">
                <div className="h-4 bg-zinc-700 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-700 animate-pulse rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
          You have no favorite albums yet
        </div>
      ) : (
        <div className="flex overflow-x-auto scrollbar-hide space-x-4 p-2">
          {albums.map((album) => (
            <div
              key={album.id}
              className="relative cursor-pointer rounded-md overflow-hidden transition-transform duration-300 w-[250px] hover:scale-105 flex-shrink-0"
              onClick={() => getContent(album.href)}
            >
              {/* Album Image */}
              <AspectRatio.Root ratio={1}>
                {album.images?.[0]?.url ? (
                  <img
                    src={album.images[0].url}
                    alt={`${album.name} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Music2 className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
              </AspectRatio.Root>

              {/* Album Details */}
              <div className="p-2">
                <h2 className="text-sm font-medium text-white truncate">
                  {album.name}
                </h2>

                <div className="flex items-center gap-1 text-zinc-400 mt-1">
                  <User2 className="w-3 h-3" />
                  <span className="text-xs truncate hover:underline">
                    {album.artists?.map((artist) => artist.name).join(", ")}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                  <Music2 className="w-3 h-3" />
                  <span>{album.total_tracks} tracks</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded-full text-xs">
                    {album.album_type}
                  </span>
                </div>
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Album Popup */}
      {albumContent && (
        <AlbumPopup
          album={albumContent}
          onClose={() => setAlbumContent(null)}
        />
      )}
    </div>
  );
};

export default AlbumGridFav;
