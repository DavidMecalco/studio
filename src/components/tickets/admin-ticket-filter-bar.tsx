
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, RotateCcw, Search } from 'lucide-react';
import type { JiraTicketStatus, JiraTicketPriority } from '@/services/jira';
import type { UserDoc as ServiceUser } from '@/services/users';
import { format, subDays } from 'date-fns';

export interface AdminTicketFilters {
  dateFrom: string;
  dateTo: string;
  status: JiraTicketStatus | 'all';
  priority: JiraTicketPriority | 'all';
  assigneeId: string | 'all'; // User ID of the assignee
  requestingClient: string | 'all'; // Organization name (provider)
  searchTerm: string;
}

interface AdminTicketFilterBarProps {
  filters: AdminTicketFilters;
  onFiltersChange: Dispatch<SetStateAction<AdminTicketFilters>>;
  users: ServiceUser[]; // For assignee and potentially requesting user filters
  organizations: string[]; // For client/organization filter
}

const ticketStatuses: Array<JiraTicketStatus | 'all'> = ['all', 'Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno'];
const ticketPriorities: Array<JiraTicketPriority | 'all'> = ['all', 'Alta', 'Media', 'Baja'];

export function AdminTicketFilterBar({ filters, onFiltersChange, users, organizations }: AdminTicketFilterBarProps) {

  const handleInputChange = (filterName: keyof AdminTicketFilters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: '', // format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      dateTo: '', // format(new Date(), 'yyyy-MM-dd'),
      status: 'all',
      priority: 'all',
      assigneeId: 'all',
      requestingClient: 'all',
      searchTerm: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Jira Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="adminTicketsAssigneeFilter" className="text-sm font-medium">Assignee</Label>
            <Select value={filters.assigneeId} onValueChange={(val) => handleInputChange('assigneeId', val)}>
              <SelectTrigger id="adminTicketsAssigneeFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.filter(u => u.role === 'admin' || u.role === 'superuser').map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.username})</SelectItem>)}
                <SelectItem value="">-- Unassigned --</SelectItem>
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

