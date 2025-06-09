import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X, Clock } from "lucide-react";

interface VerificationPopupProps {
  isVisible: boolean;
  onClose: () => void;
  username: string;
}

export default function VerificationPopup({ isVisible, onClose, username }: VerificationPopupProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <CardTitle className="text-lg">Account Verification Required</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <Clock className="h-4 w-4 mr-1" />
              Unverified Account
            </Badge>
          </div>
          
          <div className="text-center space-y-3">
            <p className="text-gray-700 font-medium">
              Welcome, {username}!
            </p>
            <p className="text-sm text-gray-600">
              Your account needs verification to access all features. Until verified, you have limited access to:
            </p>
            
            <div className="text-left space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">❌</span>
                <span>Making predictions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">❌</span>
                <span>Viewing leaderboards</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✅</span>
                <span>Browsing matches and tournaments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✅</span>
                <span>Accessing support</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Contact the admin to verify your account and unlock full access.
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Auto-close in {timeLeft}s
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/support'}
              >
                Contact Support
              </Button>
              <Button
                size="sm"
                onClick={onClose}
              >
                Got It
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}