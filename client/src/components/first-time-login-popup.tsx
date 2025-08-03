import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FirstTimeLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FirstTimeLoginPopup({ isOpen, onClose }: FirstTimeLoginPopupProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(60);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle className="text-lg font-semibold">Account Under Restriction</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            Your account will be active post approval verification by Admin.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">Verification Required</h4>
                <p className="text-sm text-orange-700">
                  Your account is currently under review. Once verified by an administrator, 
                  you'll have full access to make predictions and appear on the leaderboard.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Auto-closing in {timeLeft} seconds
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}