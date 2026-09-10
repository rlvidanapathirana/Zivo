import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getShieldPrefs, 
  saveShieldPrefs, 
  getShieldStats, 
  getShieldLogs,
  recordShieldEvent, 
  resetShieldStats,
  subscribeShieldEvents 
} from '../services/braveShieldService';
import { backgroundEngine } from '../services/backgroundPlaybackService';

const BraveShieldContext = createContext();

export function BraveShieldProvider({ children }) {
  const [prefs, setPrefs] = useState(getShieldPrefs);
  const [stats, setStats] = useState(getShieldStats);
  const [logs, setLogs] = useState(getShieldLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastBlockEvent, setLastBlockEvent] = useState(null);

  // Sync background playback engine with prefs
  useEffect(() => {
    backgroundEngine.setPreferences(prefs);
  }, [prefs]);

  // Subscribe to real-time shield events
  useEffect(() => {
    const unsubscribe = subscribeShieldEvents((event) => {
      if (event.type === 'event_recorded') {
        setStats(event.stats);
        if (event.log) {
          setLogs(prev => [event.log, ...prev.slice(0, 19)]);
        }
        setLastBlockEvent({
          type: event.eventType,
          time: Date.now()
        });
      } else if (event.type === 'stats_reset') {
        setStats(event.stats);
        setLogs([]);
      } else if (event.type === 'prefs_updated') {
        setPrefs(event.prefs);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleShield = () => {
    const updated = { ...prefs, enabled: !prefs.enabled };
    setPrefs(updated);
    saveShieldPrefs(updated);
  };

  const updatePref = (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveShieldPrefs(updated);
  };

  const trackEvent = (type, count = 1, extra = {}) => {
    const updated = recordShieldEvent(type, count, extra);
    setStats(updated);
  };

  const handleReset = () => {
    const reset = resetShieldStats();
    setStats(reset);
    setLogs([]);
  };

  return (
    <BraveShieldContext.Provider
      value={{
        prefs,
        stats,
        logs,
        lastBlockEvent,
        toggleShield,
        updatePref,
        trackEvent,
        resetStats: handleReset,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false)
      }}
    >
      {children}
    </BraveShieldContext.Provider>
  );
}

export function useBraveShield() {
  return useContext(BraveShieldContext);
}
