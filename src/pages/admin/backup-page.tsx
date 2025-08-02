import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Upload,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw
} from 'lucide-react';

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  tables: string[];
  recordCount: number;
}

export default function BackupPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backup history
  const { data: backups = [], isLoading: backupsLoading, refetch: refetchBackups } = useQuery<BackupInfo[]>({
    queryKey: ['/api/admin/backups'],
    queryFn: async () => {
      const res = await fetch('/api/admin/backups');
      if (!res.ok) throw new Error('Failed to fetch backups');
      return res.json();
    }
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to create backup');
      return res.json();
    },
    onSuccess: (data) => {
      setBackupProgress(100); // Complete the progress bar
      setTimeout(() => {
        toast({
          title: "Backup Created",
          description: `Backup ${data.filename} created successfully with ${data.recordCount} records`,
          duration: 5000
        });
        setBackupProgress(0);
      }, 500);
      refetchBackups();
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive"
      });
      setBackupProgress(0);
    }
  });

  // Download backup mutation
  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await fetch(`/api/admin/backup/download/${backupId}`);
      if (!res.ok) throw new Error('Failed to download backup');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `backup-${backupId}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Backup file download has begun",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download backup",
        variant: "destructive"
      });
    }
  });

  // Upload and restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);
      
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to restore backup');
      return res.json();
    },
    onSuccess: (data) => {
      setRestoreProgress(100); // Complete the progress bar
      setTimeout(() => {
        toast({
          title: "Restore Completed",
          description: `Successfully restored ${data.recordCount} records from backup`,
          duration: 5000
        });
        setRestoreProgress(0);
        setUploadFile(null);
      }, 500);
      queryClient.invalidateQueries();
      refetchBackups();
    },
    onError: (error) => {
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive"
      });
      setRestoreProgress(0);
    }
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await fetch(`/api/admin/backup/delete/${backupId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete backup');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Deleted",
        description: "Backup file has been removed",
        duration: 3000
      });
      refetchBackups();
    }
  });

  const handleCreateBackup = () => {
    setBackupProgress(10);
    createBackupMutation.mutate();
    
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85; // Stop at 85% to let the success handler complete it
        }
        return prev + 15;
      });
    }, 200);
  };

  const handleRestoreBackup = () => {
    if (!uploadFile) return;
    
    setRestoreProgress(10);
    restoreBackupMutation.mutate(uploadFile);
    
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85; // Stop at 85% to let the success handler complete it
        }
        return prev + 15;
      });
    }, 300);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Restore</h1>
        <p className="text-gray-600">
          Create, download, and restore database backups to protect your data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Backup Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a complete backup of all database tables including users, matches, predictions, and settings.
            </p>
            
            {backupProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="h-2" />
              </div>
            )}
            
            <Button 
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending || backupProgress > 0}
              className="w-full"
            >
              {createBackupMutation.isPending || backupProgress > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Create New Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload & Restore Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Upload & Restore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a backup file to restore your database. This will overwrite existing data.
            </p>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Restoring a backup will replace all current data. Make sure to create a backup first.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <input
                type="file"
                accept=".sql,.zip"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {uploadFile && (
                <div className="text-sm text-gray-600">
                  Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </div>
              )}
            </div>

            {restoreProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Restoring backup...</span>
                  <span>{restoreProgress}%</span>
                </div>
                <Progress value={restoreProgress} className="h-2" />
              </div>
            )}
            
            <Button 
              onClick={handleRestoreBackup}
              disabled={!uploadFile || restoreBackupMutation.isPending || restoreProgress > 0}
              className="w-full"
              variant="outline"
            >
              {restoreBackupMutation.isPending || restoreProgress > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{backup.filename}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(backup.createdAt)} • {formatFileSize(backup.size)} • {backup.recordCount} records
                      </div>
                      <div className="flex gap-1 mt-1">
                        {backup.tables.slice(0, 3).map((table) => (
                          <Badge key={table} variant="secondary" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                        {backup.tables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{backup.tables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBackupMutation.mutate(backup.id)}
                      disabled={downloadBackupMutation.isPending}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBackupMutation.mutate(backup.id)}
                      disabled={deleteBackupMutation.isPending}
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}