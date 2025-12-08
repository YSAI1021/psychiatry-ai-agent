'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailPreviewProps {
  emailDraft: string;
  psychiatristName: string;
  onEdit?: (editedEmail: string) => void;
  onSend: (emailContent: string) => Promise<void>;
  onCancel?: () => void;
}

export function EmailPreview({
  emailDraft,
  psychiatristName,
  onEdit,
  onSend,
  onCancel,
}: EmailPreviewProps) {
  const [isSending, setIsSending] = useState(false);
  const [editedEmail, setEditedEmail] = useState(emailDraft);

  // Update local state when emailDraft prop changes
  useEffect(() => {
    setEditedEmail(emailDraft);
  }, [emailDraft]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(editedEmail);
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(editedEmail);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
        <CardDescription>
          Review the email that will be sent to {psychiatristName}. You can edit it before sending.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-content">Email Content</Label>
          <Textarea
            id="email-content"
            value={editedEmail}
            onChange={(e) => setEditedEmail(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            Once you approve, this email will be sent to the psychiatrist. Make sure all information is accurate.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Save Edits
          </Button>
        )}
        <Button onClick={handleSend} disabled={isSending} className="ml-auto">
          <Send className="mr-2 h-4 w-4" />
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </CardFooter>
    </Card>
  );
}

