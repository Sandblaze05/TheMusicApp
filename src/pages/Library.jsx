import React from 'react'
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { useEffect } from 'react';

const LibraryPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User didn't login.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  return (
    <main className='min-h-screen text-white text-3xl'>
        library
    </main>
  )
}

export default LibraryPage