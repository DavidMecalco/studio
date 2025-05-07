
"use client";

import { TicketHistoryItem } from '../tickets/ticket-history-item'; // Re-use for similar display logic
import type { CombinedAuditEntry } from '@/app/(app)/audit-log/page'; // Import the combined type
import { AlertTriangle } from 'lucide-react';

interface AuditLogListProps {
  auditEntries: CombinedAuditEntry[];
}

export function AuditLogList({ auditEntries }: AuditLogListProps) {
  if (!auditEntries || auditEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No audit entries found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-0">
        {auditEntries.map((entry, index) => (
          // TicketHistoryItem can be adapted or a new AuditEntryItem can be created
          // For now, we'll use TicketHistoryItem and it will handle the display based on 'action' and 'details'
          // Make sure TicketHistoryItem can gracefully handle the 'entryType' or new fields if needed for specific styling.
          <TicketHistoryItem
            key={`${entry.id}-${entry.timestamp}-${index}`} // More unique key
            entry={entry} // Pass the CombinedAuditEntry
            isLastItem={index === auditEntries.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
