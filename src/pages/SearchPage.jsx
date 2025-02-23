import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useGlobalContext } from "../GlobalContext";
import { Play, Clock, Music } from "lucide-react";
import AlbumPopup from "../components/AlbumPopup";

const SearchPage = () => {
  const { query } = useParams();
  const { token, setToken } = useGlobalContext();
  const [user, setUser] = useState(null);
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [albumContent, setAlbumContent] = useState(null);
  const navigate = useNavigate();

  const spotifyToken = async () => {
    console.log("getting token");
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

      console.log(
        "Token received:",
        data.access_token ? "Token present" : "No token in response"
      );
      setToken(data.access_token);
    } catch (err) {
      const errorMessage = `Token fetch failed: ${err.message}`;
      console.error(errorMessage);
      setError(errorMessage);
      setToken(null);
    }
  };
  
  const fetchQuery = async () => {
    console.log(token);
    setLoading(true);
    try {
      const authOptions = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    spotifyToken();
    if (token) {
      fetchQuery();
    }
    // window.playTrackDirectly('Jugnu');
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
    if (!result?.tracks?.items?.length) return null;
    
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Songs</h2>
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg overflow-hidden">
          {result.tracks.items.map((track) => (
            <div 
              key={track.id}
              className="group flex items-center gap-4 p-3 hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-700/50 last:border-0"
              onClick={() => window.playTrackDirectly(track.name)}
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
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
              <div className="text-gray-400 text-sm flex-shrink-0">
                {formatDuration(track.duration_ms)}
              </div>
            </div>
          ))}
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
                <h3 className="text-white font-semibold truncate">{artist.name}</h3>
                <p className="text-gray-400 text-sm truncate">
                  {artist.genres?.slice(0, 2).join(' • ')}
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
    if (!result?.albums?.items?.length) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {result.albums.items.map((album) => (
            <div
              key={album.id}
              className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-lg hover:bg-gray-700/50 transition-all duration-300 group relative"
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
                <h3 className="text-white font-semibold truncate">{album.name}</h3>
                <p className="text-gray-400 text-sm truncate">
                  {album.artists?.map(a => a.name).join(', ')}
                </p>
              </div>

              <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <TracksSection />
        <ArtistsSection />
        <AlbumsSection />
        {albumContent && <AlbumPopup album={albumContent} onClose={() => setAlbumContent(null)}/>}
      </div>
    </div>
  );
};

export default SearchPage;
