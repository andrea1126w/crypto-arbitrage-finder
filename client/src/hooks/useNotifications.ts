import { useState, useEffect, useRef, useCallback } from "react";

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  minProfitPercentage: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  soundEnabled: true,
  minProfitPercentage: 2,
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("notification_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Create audio element for notification sound
    audioRef.current = new Audio();
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGG0fPTgjMGHm7A7+OZSA8PVqzn77BgGAg+ltryxnMnBiyAzvLaiTcIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUxhtHz04IzBh5uwO/jmUgPD1as5++wYBgIPpba8sZzJwYsgtDy2Ik3CBlou+3mn0wQDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAAhRftOvrqFUUCkaf4PK+bCEFMYbR89OCMwYebsDv45lIDw9WrOfvsGAYCD6W2vLGcycGLILQ8tqJNwgZaLvt5p9MEAxQp+PwtmMcBjiS1/LMeSwFJHfH8N2QQAIUXrTr66hVFApGn+DyvmwhBTGG0fPTgjMGHm7A7+OZSA8PVqzn77BgGAg+ltryxnMnBiyC0PLaiTcIGWi77eafTBAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEACFF606+uoVRQKRp/g8r5sIQUxhtHz04IzBh5uwO/jmUgPD1as5++wYBgIPpba8sZzJwYsgtDy2ok3CBlou+3mn0wQDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAAhRftOvrqFUUCkaf4PK+bCEFMYbR89OCMwYebsDv45lIDw9WrOfvsGAYCD6W2vLGcycGLILQ8tqJNwgZaLvt5p9MEAxQp+PwtmMcBjiS1/LMeSwFJHfH8N2QQAIUXrTr66hVFApGn+DyvmwhBTGG0fPTgjMGHm7A7+OZSIwPVqzn77BgGAg+ltryxnMnBiyC0PLaiTcIGWi77eafTBAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEACFF606+uoVRQKRp/g8r5sIQUxhtHz04IzBh5uwO/jmUiMD1as5++wYBgIPpba8sZzJwYsgtDy2ok3CBlou+3mn0wQDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAAhRftOvrqFUUCkaf4PK+bCEFMYbR89OCMwYebsDv45lIDw9WrOfvsGAYCD6W2vLGcycGLILQ8tqJNwgZaLvt5p9MEAxQp+PwtmMcBjiS1/LMeSwFJHfH8N2QQAIUXrTr66hVFApGn+DyvmwhBTGG0fPTgjMGHm7A7+OZSIwPVqzn77BgGAg+ltryxnMnBiyC0PLaiTcIGWi77eafTBAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEACFF606+uoVRQKRp/g8r5sIQUxhtHz04IzBh5uwO/jmUiMD1as5++wYBgIPpba8sZzJwYsgtDy2ok3CBlou+3mn0wQDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAA=";

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("notification_settings", JSON.stringify(settings));
  }, [settings]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Browser non supporta le notifiche");
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === "granted") {
      setSettings(prev => ({ ...prev, enabled: true }));
      return true;
    }
    
    return false;
  }, []);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Errore riproduzione audio:", err));
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((
    opportunityId: string,
    pair: string,
    profitPercentage: number,
    profitUsd: number
  ) => {
    if (!settings.enabled || permission !== "granted") {
      return;
    }

    // Don't notify for the same opportunity twice
    if (notifiedIds.current.has(opportunityId)) {
      return;
    }

    if (profitPercentage >= settings.minProfitPercentage) {
      notifiedIds.current.add(opportunityId);

      // Clean up old IDs (keep last 100)
      if (notifiedIds.current.size > 100) {
        const idsArray = Array.from(notifiedIds.current);
        notifiedIds.current = new Set(idsArray.slice(-100));
      }

      new Notification("🚀 Nuova Opportunità di Arbitraggio!", {
        body: `${pair}: +${profitPercentage.toFixed(2)}% ($${profitUsd.toFixed(2)})`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: opportunityId,
        requireInteraction: false,
      });

      playSound();
    }
  }, [settings, permission, playSound]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    permission,
    requestPermission,
    showNotification,
    updateSettings,
  };
}
