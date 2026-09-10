import { createContext, useContext, useState, useEffect } from 'react';
import { getShieldPrefs, saveShieldPrefs, getShieldStats, recordShieldEvent } from '../services/braveShieldService';

const BraveShieldContext = createContext();

export function BraveShieldProvider({ children }) {
  const [prefs, setPrefs] = useState(getShieldPrefs);
  const [stats, setStats] = useState(getShieldStats);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    saveShieldPrefs(prefs);
  }, [prefs]);

  const toggleShield = () => {
    setPrefs(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const updatePref = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const trackEvent = (type, count = 1, extra = {}) => {
    const updated = recordShieldEvent(type, count, extra);
    setStats(updated);
  };

  return (
    <BraveShieldContext.Provider
      value={{
        prefs,
        stats,
        toggleShield,
        updatePref,
        trackEvent,
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
