import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { backgroundEngine } from '../services/backgroundPlaybackService';
import { addToHistory } from '../services/libraryService';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Play a new video
  const playVideo = (video, openWatch = true) => {
    if (!video || !video.id) return;
    
    // Add to history
    addToHistory(video);

    // Force fresh state reference
    setCurrentVideo({ ...video });
    setIsPlaying(true);
    if (openWatch) {
      setIsMiniPlayer(false);
    }
  };

  const minimizePlayer = () => {
    if (currentVideo) {
      setIsMiniPlayer(true);
    }
  };

  const expandPlayer = () => {
    if (currentVideo) {
      setIsMiniPlayer(false);
    }
  };

  const closePlayer = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
    setIsMiniPlayer(false);
    backgroundEngine.unregisterPlayer();
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        setIsPlaying,
        isMiniPlayer,
        setIsMiniPlayer,
        audioOnlyMode,
        setAudioOnlyMode,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        playVideo,
        minimizePlayer,
        expandPlayer,
        closePlayer,
        togglePlayPause
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
