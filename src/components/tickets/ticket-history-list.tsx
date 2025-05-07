"use client";

import type { JiraTicketHistoryEntry } from '@/services/jira';
import { TicketHistoryItem } from './ticket-history-item';

interface TicketHistoryListProps {
  history: JiraTicketHistoryEntry[];
  title?: string;
}

export function TicketHistoryList({ history, title = "Historial del Ticket" }: TicketHistoryListProps) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay historial para este ticket.</p>;
  }

  // Sort history by timestamp descending (most recent first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-2">
      {title && <h4 className="text-md font-semibold text-foreground mb-3">{title}</h4>}
      <ul className="space-y-0">
        {sortedHistory.map((entry, index) => (
          <TicketHistoryItem 
            key={entry.id} 
            entry={entry} 
            isLastItem={index === sortedHistory.length - 1} 
          />
        ))}
      </ul>
    </div>
  );
}