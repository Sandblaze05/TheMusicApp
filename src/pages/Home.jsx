import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useEffect, useState } from "react";
import MusicCard from "../components/MusicCard";
import AlbumGrid from "../components/AlbumGrid";
import { motion } from "framer-motion";
import { useGlobalContext } from "../GlobalContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { token, setToken } = useGlobalContext();
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const stableUser = useMemo(() => user, [user]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const getAlbums = async () => {
    setLoading(true);
    console.log("getting albums");
    const authOptions = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(
        "https://api.spotify.com/v1/browse/new-releases",
        authOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to fetch albums: ${response.status} ${
            response.statusText
          } - ${data.error?.message || "Unknown error"}`
        );
      }

      console.log("Albums received:", data.albums?.items?.length || 0);
      console.log(data.albums.items);
      setNewReleases(data.albums.items);
    } catch (err) {
      const errorMessage = `Album fetch failed: ${err.message}`;
      console.error(errorMessage);
      setError(errorMessage);
      setNewReleases([]);
    } finally {
      setLoading(false);
    }
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
    const sequence = async () => {
      if (stableUser) {
        await spotifyToken();
      }
    };
    sequence();
  }, [stableUser]);

  useEffect(() => {
    if (token) {
      getAlbums();
    }
  }, [token]);

  return (
    <main className="min-h-screen p-4 mt-1 text-white text-3xl">
      <div className="">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className=" p-4 text-3xl font-bold text-gray-100 hover:text-white glow"
        >
          | New Releases
        </motion.div>
        <AlbumGrid loading={loading} albums={newReleases} token={token} />
      </div>
    </main>
  );
};

export default HomePage;
