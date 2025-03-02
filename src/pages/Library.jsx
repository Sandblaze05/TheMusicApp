import React from "react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useGlobalContext } from "../GlobalContext";
import { collection, doc, getDocs } from "firebase/firestore";
import AlbumGrid from "../components/AlbumGrid";
import AlbumGridFav from "../components/AlbumGridFav";

const LibraryPage = () => {
  const navigate = useNavigate();
  const { token, setToken } = useGlobalContext();
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const stableUser = useMemo(() => user, [user]);
  const [userFavoriteAlbums, setUserFavoriteAlbums] = useState([]);
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

  const getAlbums = async ( listOfId ) => {
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
        `https://api.spotify.com/v1/albums?ids=${encodeURIComponent(listOfId.join(","))}&market=IN`,
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

      console.log("Albums received:", data.albums?.length || 0);
      console.log(data.albums);
      setUserFavoriteAlbums(data.albums);
    } catch (err) {
      const errorMessage = `Album fetch failed: ${err.message}`;
      console.error(errorMessage);
      setError(errorMessage);
      setUserFavoriteAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const getFavorites = async () => {
    if (!stableUser) return [];

    try {
      const favoriteRef = collection(db, `users/${user.uid}/favorites`);
      const querySnapshot = await getDocs(favoriteRef);

      const favorites = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      return favorites.map((fav) => fav.id);
    }
    catch (err) {
      console.log("Error fetching favorites: ", err);
      return [];
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
        const out = await getFavorites();
        console.log(out);
        getAlbums(out);
      }
    };
    sequence();
  }, [stableUser]);

  return (
    <main className="min-h-screen p-4 mt-1 text-white text-3xl">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="p-4 w-fit text-3xl font-bold text-gray-100 hover:text-white glow"
        >
          | Favorite Albums
        </motion.div>
        <AlbumGridFav loading={loading} albums={userFavoriteAlbums} token={token} />
      </div>
    </main>
  );
};

export default LibraryPage;
