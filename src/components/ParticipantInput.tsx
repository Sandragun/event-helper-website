import React, { useState, useEffect } from 'react';
import { Participant } from '../types/participant';
import { parseParticipants, validateParticipants } from '../utils/participantParser';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Mail, User, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface ParticipantInputProps {
  onParticipantsChange: (participants: Participant[]) => void;
}

const ParticipantInput = ({ onParticipantsChange }: ParticipantInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (inputValue.trim()) {
      const parsed = parseParticipants(inputValue);
      setParticipants(parsed);
      onParticipantsChange(parsed);
      setShowPreview(parsed.length > 0);
    } else {
      setParticipants([]);
      onParticipantsChange([]);
      setShowPreview(false);
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
    setParticipants([]);
    onParticipantsChange([]);
    setShowPreview(false);
    toast.info('Participants cleared');
  };

  const handleRemoveParticipant = (index: number) => {
    const lines = inputValue.split('\n');
    lines.splice(index, 1);
    setInputValue(lines.join('\n'));
  };

  const validation = validateParticipants(participants);
  const hasEmails = participants.some(p => p.email);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="participants" className="text-sm font-medium">
            Participants (Name and Email)
          </label>
          {inputValue && (
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            id="participants"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Senthilkumar M K S	senthilm9@srmist.edu.in&#10;ROHITH A	ra9734@srmist.edu.in&#10;Shresht Sebastian	hs3384@srmist.edu.in"
            className="w-full min-h-[120px] px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50
                      bg-transparent rounded-md border input-focus resize-y"
            spellCheck={false}
          />

          {participants.length > 0 && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              {hasEmails && (
                <Badge variant="secondary" className="gap-1">
                  <Mail className="h-3 w-3" />
                  Email Ready
                </Badge>
              )}
              <Badge variant="default" className="gap-1">
                <User className="h-3 w-3" />
                {participants.length}
              </Badge>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Paste data with names and emails (tab or space separated). Each line = one participant.
        </p>
      </div>

      {showPreview && participants.length > 0 && (
        <div className="border rounded-lg overflow-hidden animate-slide-up">
          <div className="bg-muted/50 px-3 py-2 flex justify-between items-center border-b">
            <h3 className="text-sm font-medium flex items-center gap-2">
              Parsed Participants
              {validation.valid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </h3>
            <span className="text-xs text-muted-foreground">
              {participants.length} total
            </span>
          </div>

          {!validation.valid && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-b">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {error}
                </p>
              ))}
            </div>
          )}

          <ScrollArea className="h-[200px]">
            <div className="divide-y">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-muted/30 transition-colors group flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.name}
                        </p>
                        {participant.email ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No email provided
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    title="Remove participant"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ParticipantInput;
