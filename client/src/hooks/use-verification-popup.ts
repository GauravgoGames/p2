import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

export function useVerificationPopup() {
  const { user, isAuthenticated } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.isVerified) {
      // Check if user has seen popup in this session
      const hasSeenPopup = sessionStorage.getItem(`verification-popup-${user.id}`);
      
      if (!hasSeenPopup) {
        // Show popup after a short delay
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  const closePopup = () => {
    setShowPopup(false);
    if (user) {
      // Mark as seen for this session
      sessionStorage.setItem(`verification-popup-${user.id}`, 'true');
    }
  };

  return {
    showPopup: showPopup && user && !user.isVerified,
    closePopup,
    user
  };
}