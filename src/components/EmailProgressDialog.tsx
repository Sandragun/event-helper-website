import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Progress } from './ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface EmailProgressDialogProps {
  open: boolean;
  current: number;
  total: number;
  logs: Array<{ name: string; success: boolean }>;
}

const EmailProgressDialog = ({ open, current, total, logs }: EmailProgressDialogProps) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const successful = logs.filter(log => log.success).length;
  const failed = logs.filter(log => !log.success).length;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending Certificates via Email
          </DialogTitle>
          <DialogDescription>
            Please wait while we send certificates to all participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {current} / {total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-2xl font-bold">{successful}</span>
              </div>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-2xl font-bold">{failed}</span>
              </div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <h4 className="text-sm font-medium">Email Log</h4>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="divide-y">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <span className="truncate flex-1">{log.name}</span>
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailProgressDialog;
