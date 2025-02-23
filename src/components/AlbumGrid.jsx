import React, { useEffect, useState } from "react";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import { CalendarIcon, Music2, User2 } from "lucide-react";
import AlbumPopup from "./AlbumPopup";

const AlbumGrid = ({ albums, loading, token }) => {
  const indianAlbums = albums.filter((album) =>
    album.available_markets?.includes("IN")
  );
  const [albumContent, setAlbumContent] = useState(null);
  // const [fetchURL, setFetchURL] = useState('');
  const [error, setError] = useState('');
  const [albumLoading, setAlbumLoading] = useState(false);

  const getContent = async (fetchURL) => {
    setAlbumLoading(true);
    try {
      if (fetchURL !== ''){
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
    finally {
      setAlbumLoading(false);
    }
  };

  // useEffect(() => {
  //   getContent();
  // }, [fetchURL]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-x-auto scrollbar-hide space-x-4 p-2">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={index}
              className="relative min-w-[150px] md:min-w-0 rounded-md overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-square bg-zinc-800" />
              <div className="p-2">
                <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  

  if (indianAlbums.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        No new releases available at the moment
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 flex md:flex-none overflow-x-auto scrollbar-hide space-x-4 p-2">
        {indianAlbums.map((album) => (
          <div
            key={album.id}
            className="relative cursor-default rounded-md overflow-hidden transition-all duration-300 min-w-[150px] md:min-w-0 hover:scale-[1.02] hover:shadow-[0_0_10px_rgb(255,255,255,0.8)]"
            onClick={() => getContent(album.href)}
          >
            <div className="w-full">
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
            </div>
  
            <div className="p-2">
              <h2 className="text-sm font-medium text-white truncate">
                {album.name}
              </h2>
  
              <div className="flex items-center gap-1 text-zinc-400 mt-1">
                <User2 className="w-3 h-3" />
                <span className="text-xs truncate hover:underline hover:decoration-white cursor-pointer">
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
  
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>
      {albumContent && <AlbumPopup album={albumContent} onClose={() => setAlbumContent(null)}/>}
    </div>
  );
  
};

export default AlbumGrid;
