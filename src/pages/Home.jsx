import React from 'react'
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { useEffect } from 'react';
import MusicCard from '../components/MusicCard';

const HomePage = () => {
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
    <main className='min-h-screen p-4 mt-1 text-white text-3xl'>
      <MusicCard />
    </main>
  )
}

export default HomePage