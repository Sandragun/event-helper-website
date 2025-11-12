import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { EmailConfig } from '../types/participant';
import { AlertCircle } from 'lucide-react';

interface EmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSave: (config: EmailConfig) => void;
  currentConfig?: EmailConfig | null;
}

const EmailConfigDialog = ({
  open,
  onOpenChange,
  onConfigSave,
  currentConfig
}: EmailConfigDialogProps) => {
  const [serviceId, setServiceId] = useState(currentConfig?.serviceId || '');
  const [templateId, setTemplateId] = useState(currentConfig?.templateId || '');
  const [publicKey, setPublicKey] = useState(currentConfig?.publicKey || '');

  const handleSave = () => {
    if (serviceId && templateId && publicKey) {
      onConfigSave({ serviceId, templateId, publicKey });
      onOpenChange(false);
    }
  };

  const isValid = serviceId && templateId && publicKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure EmailJS</DialogTitle>
          <DialogDescription>
            Enter your EmailJS credentials to enable email sending functionality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Get these credentials from your EmailJS dashboard. Create a free account at{' '}
                <a
                  href="https://www.emailjs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  emailjs.com
                </a>
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="service_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="template_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Your public key"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              <strong>Template Variables:</strong> Your EmailJS template should include these variables:
              <code className="block mt-1 font-mono text-[10px]">
                {`{{to_name}}, {{to_email}}, {{event_name}}, {{participant_name}}`}
              </code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConfigDialog;
