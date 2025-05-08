
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, RotateCcw, Search } from 'lucide-react';
import type { TicketStatus, TicketPriority, TicketType } from '@/services/tickets'; // Updated import
import { TICKET_TYPES } from '@/services/tickets'; // Updated import
import type { UserDoc as ServiceUser } from '@/services/users';
import { format, subDays } from 'date-fns';

export const UNASSIGNED_ASSIGNEE_FILTER_VALUE = "__UNASSIGNED_ASSIGNEE__";

export interface AdminTicketFilters {
  dateFrom: string;
  dateTo: string;
  status: TicketStatus | 'all'; // Updated type
  priority: TicketPriority | 'all'; // Updated type
  type: TicketType | 'all'; 
  assigneeId: string | 'all'; 
  requestingClient: string | 'all'; 
  searchTerm: string;
}

interface AdminTicketFilterBarProps {
  filters: AdminTicketFilters;
  onFiltersChange: Dispatch<SetStateAction<AdminTicketFilters>>;
  users: ServiceUser[]; 
  organizations: string[]; 
}

const ticketStatuses: Array<TicketStatus | 'all'> = ['all', 'Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno', 'Reabierto']; // Updated type
const ticketPriorities: Array<TicketPriority | 'all'> = ['all', 'Alta', 'Media', 'Baja']; // Updated type
const ticketTypesForFilter: Array<TicketType | 'all'> = ['all', ...TICKET_TYPES]; // Updated type


export function AdminTicketFilterBar({ filters, onFiltersChange, users, organizations }: AdminTicketFilterBarProps) {

  const handleInputChange = (filterName: keyof AdminTicketFilters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: '', 
      dateTo: '', 
      status: 'all',
      priority: 'all',
      type: 'all',
      assigneeId: 'all',
      requestingClient: 'all',
      searchTerm: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Tickets</CardTitle> {/* Updated title */}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
          <div>
            <Label htmlFor="adminTicketsDateFromFilter" className="text-sm font-medium">From</Label>
            <Input id="adminTicketsDateFromFilter" type="date" value={filters.dateFrom} onChange={(e) => handleInputChange('dateFrom', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="adminTicketsDateToFilter" className="text-sm font-medium">To</Label>
            <Input id="adminTicketsDateToFilter" type="date" value={filters.dateTo} onChange={(e) => handleInputChange('dateTo', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="adminTicketsStatusFilter" className="text-sm font-medium">Status</Label>
            <Select value={filters.status} onValueChange={(val) => handleInputChange('status', val)}>
              <SelectTrigger id="adminTicketsStatusFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketStatuses.map(status => <SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="adminTicketsPriorityFilter" className="text-sm font-medium">Priority</Label>
            <Select value={filters.priority} onValueChange={(val) => handleInputChange('priority', val)}>
              <SelectTrigger id="adminTicketsPriorityFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketPriorities.map(priority => <SelectItem key={priority} value={priority}>{priority === 'all' ? 'All Priorities' : priority}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="adminTicketsTypeFilter" className="text-sm font-medium">Type</Label>
            <Select value={filters.type} onValueChange={(val) => handleInputChange('type', val)}>
              <SelectTrigger id="adminTicketsTypeFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketTypesForFilter.map(type => <SelectItem key={type} value={type}>{type === 'all' ? 'All Types' : type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="adminTicketsAssigneeFilter" className="text-sm font-medium">Assignee</Label>
            <Select value={filters.assigneeId} onValueChange={(val) => handleInputChange('assigneeId', val)}>
              <SelectTrigger id="adminTicketsAssigneeFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.filter(u => u.role === 'admin' || u.role === 'superuser').map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.username})</SelectItem>)}
                <SelectItem value={UNASSIGNED_ASSIGNEE_FILTER_VALUE}>-- Unassigned --</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="adminTicketsClientFilter" className="text-sm font-medium">Client/Provider</Label>
            <Select value={filters.requestingClient} onValueChange={(val) => handleInputChange('requestingClient', val)}>
              <SelectTrigger id="adminTicketsClientFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients/Providers</SelectItem>
                {organizations.map(orgName => <SelectItem key={orgName} value={orgName}>{orgName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-full"> 
            <Label htmlFor="adminTicketsSearchTermFilter" className="text-sm font-medium">Search (ID, Title, Desc.)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="adminTicketsSearchTermFilter" 
                type="search" 
                placeholder="Ticket ID, keyword..." 
                value={filters.searchTerm} 
                onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <Button onClick={resetFilters} variant="outline" className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
