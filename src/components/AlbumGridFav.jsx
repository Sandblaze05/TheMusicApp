import React, { useState } from "react";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import { Music2, User2, Heart, Sparkles, Star } from "lucide-react";
import AlbumPopup from "./AlbumPopup";
import { motion } from "framer-motion";
import { useGlobalContext } from "../GlobalContext";

const AlbumGridFav = ({ albums, loading, token }) => {
  const [albumContent, setAlbumContent] = useState(null);
  const [error, setError] = useState("");
  const [albumLoading, setAlbumLoading] = useState(false);
  const { setToken } = useGlobalContext();

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

  // Container variants for parent animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  // Item variants for individual album card animations
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    hover: {
      scale: 1.05,
      y: -5,
      boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  return (
    <div className="p-4 relative">
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-64 rounded-xl bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 backdrop-blur-sm border border-zinc-700/50"
        >
          <Heart className="w-12 h-12 mb-4 text-zinc-500 stroke-[1.5]" />
          <p className="text-zinc-400 text-sm mb-2">
            You have no favorite albums yet
          </p>
          <p className="text-zinc-500 text-xs">Albums you ♥ will appear here</p>
        </motion.div>
      ) : (
        <motion.div
          className="flex overflow-x-auto scrollbar-hide space-x-4 p-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              className="relative cursor-pointer rounded-md overflow-hidden w-[250px] flex-shrink-0 bg-zinc-900/80 border border-zinc-800/50"
              onClick={() => getContent(album.href)}
              variants={itemVariants}
              whileHover="hover"
              custom={index}
            >
              {/* Favorite Badge */}
              <div className="absolute top-2 right-2 z-10 bg-rose-500/85 rounded-full p-1.5 shadow-lg">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>

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
              <div className="p-3">
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

                <div className="flex flex-wrap gap-1 mt-3">
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded-full text-xs flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" /> Favorite
                  </span>
                </div>
              </div>

              {/* Gradient Overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Album Popup */}
      {albumContent && (
        <AlbumPopup
          album={albumContent}
          onClose={() => setAlbumContent(null)}
        />
      )}

      {/* loading */}
      {!loading && albums.length > 0 && (
        <>
          <motion.div
            className="absolute -top-4 -left-4 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5, duration: 1 }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.7, duration: 1 }}
          />
        </>
      )}
    </div>
  );
};

export default AlbumGridFav;
