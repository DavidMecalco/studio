
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, RotateCcw, Search } from 'lucide-react';
import type { User as ServiceUser } from '@/services/users';
import { format, subDays } from 'date-fns';
import { Skeleton } from '../ui/skeleton';


export type AuditActionType = 'all' | 'deployment' | 'ticket_status_change' | 'ticket_commit' | 'ticket_created' | 'file_restored';

export interface AuditFilters {
  dateFrom: string;
  dateTo: string;
  selectedUserId: string; // 'all' or user ID
  selectedActionType: AuditActionType;
  searchTerm: string;
}

interface AuditLogFiltersProps {
  filters: AuditFilters;
  onFiltersChange: Dispatch<SetStateAction<AuditFilters>>;
  users: ServiceUser[];
  isLoading?: boolean;
}

const actionTypes: { value: AuditActionType, label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'deployment', label: 'Deployments' },
  { value: 'ticket_status_change', label: 'Ticket Status Changes' },
  { value: 'ticket_commit', label: 'Ticket Commits' },
  { value: 'ticket_created', label: 'Ticket Creations' },
  { value: 'file_restored', label: 'File Restorations' },
];

export function AuditLogFilters({
  filters,
  onFiltersChange,
  users,
  isLoading = false,
}: AuditLogFiltersProps) {

  const handleInputChange = (filterName: keyof AuditFilters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
      selectedUserId: 'all',
      selectedActionType: 'all',
      searchTerm: '',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={`filter-skel-${i}`} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Audit Log Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="dateFromFilter" className="text-sm font-medium">From</Label>
            <Input id="dateFromFilter" type="date" value={filters.dateFrom} onChange={(e) => handleInputChange('dateFrom', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateToFilter" className="text-sm font-medium">To</Label>
            <Input id="dateToFilter" type="date" value={filters.dateTo} onChange={(e) => handleInputChange('dateTo', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="userFilter" className="text-sm font-medium">User</Label>
            <Select value={filters.selectedUserId} onValueChange={(val) => handleInputChange('selectedUserId', val)}>
              <SelectTrigger id="userFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="actionTypeFilter" className="text-sm font-medium">Action Type</Label>
            <Select value={filters.selectedActionType} onValueChange={(val) => handleInputChange('selectedActionType', val as AuditActionType)}>
              <SelectTrigger id="actionTypeFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {actionTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:col-span-1"> {/* Search term takes full width on smaller, spans 1 on XL */}
            <Label htmlFor="searchTermFilter" className="text-sm font-medium">Search Term</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="searchTermFilter" 
                type="search" 
                placeholder="Ticket ID, SHA, message..." 
                value={filters.searchTerm} 
                onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <Button onClick={resetFilters} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}

