import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase/firebase";

const SearchPage = () => {
  const { query } = useParams();
  const [user, setUser] = useState(null);
  const [result, setResult] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://saavn.dev/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      console.log(data);
      setResult(data);
    }
    catch (err) {
      setError(`Error in search: ${err}`);
      console.log(err);
    }
    finally {
      setLoading(false);
      setError('');
    }
  };

  useEffect(() => {
    fetchQuery();
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

  return(
    <main className="min-h-screen p-4 mt-1 text-white text-3xl">
      {query}
    </main>
  );
};

export default SearchPage;
