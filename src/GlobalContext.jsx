import React from 'react'
import { createContext, useContext, useState } from 'react'

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [trackList, setTrackList] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState('');
    const [errorPlaying, setErrorPlaying] = useState('');
    const [urlPlay, setUrlPlay] = useState(null);
    const [queueState, setQueueState] = useState(false);
    const [token, setToken] = useState(null);
  return (
    <GlobalContext.Provider value={{ trackList, setTrackList, isPlaying, setIsPlaying, currentTrack, setCurrentTrack, errorPlaying, setErrorPlaying, urlPlay, setUrlPlay, queueState, setQueueState, token, setToken }}>
        {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
