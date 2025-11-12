import React from 'react';
import { Input } from './ui/input';

interface EventNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

const EventNameInput = ({ value, onChange }: EventNameInputProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="eventName" className="text-sm font-medium">
        Event Name
      </label>
      <Input
        id="eventName"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Tech Symposium 2024"
        className="text-base"
      />
      <p className="text-xs text-muted-foreground">
        This name will be used for the ZIP file and email content
      </p>
    </div>
  );
};

export default EventNameInput;
