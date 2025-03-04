import React, { createContext, useContext, useState, useMemo } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [trackList, setTrackList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState("");
  const [errorPlaying, setErrorPlaying] = useState("");
  const [urlPlay, setUrlPlay] = useState(null);
  const [queueState, setQueueState] = useState(false);
  const [token, setToken] = useState(null);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      trackList,
      setTrackList,
      isPlaying,
      setIsPlaying,
      currentTrack,
      setCurrentTrack,
      errorPlaying,
      setErrorPlaying,
      urlPlay,
      setUrlPlay,
      queueState,
      setQueueState,
      token,
      setToken,
    }),
    [trackList, isPlaying, currentTrack, errorPlaying, urlPlay, queueState, token]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
