
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, RotateCcw } from 'lucide-react';
import type { UserDoc as ServiceUser } from '@/services/users'; // Updated to UserDoc
import type { JiraTicketStatus, JiraTicketProvider } from '@/services/jira';
import type { DeploymentEnvironment } from '@/services/deployment';
import { format, subDays } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  selectedUserId: string; // 'all' or user ID
  selectedStatus: JiraTicketStatus | 'all';
  selectedClient: string | 'all'; // Changed from JiraTicketProvider to string
  selectedEnvironment: DeploymentEnvironment | 'all';
}

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onFiltersChange: Dispatch<SetStateAction<AnalyticsFilters>>;
  users: ServiceUser[];
  clients: string[]; // Changed from JiraTicketProvider[] to string[]
  environments: DeploymentEnvironment[];
  isLoading?: boolean;
}

const ticketStatuses: Array<JiraTicketStatus | 'all'> = ['all', 'Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno'];

export function AnalyticsFilterBar({
  filters,
  onFiltersChange,
  users,
  clients,
  environments,
  isLoading = false,
}: AnalyticsFilterBarProps) {

  const handleInputChange = (filterName: keyof AnalyticsFilters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
      selectedUserId: 'all',
      selectedStatus: 'all',
      selectedClient: 'all',
      selectedEnvironment: 'all',
    });
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                     {[...Array(5)].map((_, i) => <Skeleton key={`filter-skel-${i}`} className="h-10 w-full" />)}
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros de Analítica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="dateFromFilter" className="text-sm font-medium">Desde</Label>
            <Input id="dateFromFilter" type="date" value={filters.dateFrom} onChange={(e) => handleInputChange('dateFrom', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateToFilter" className="text-sm font-medium">Hasta</Label>
            <Input id="dateToFilter" type="date" value={filters.dateTo} onChange={(e) => handleInputChange('dateTo', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="userFilter" className="text-sm font-medium">Usuario (Técnico)</Label>
            <Select value={filters.selectedUserId} onValueChange={(val) => handleInputChange('selectedUserId', val)}>
              <SelectTrigger id="userFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Usuarios</SelectItem>
                {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium">Estado del Ticket</Label>
            <Select value={filters.selectedStatus} onValueChange={(val) => handleInputChange('selectedStatus', val)}>
              <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketStatuses.map(status => <SelectItem key={status} value={status}>{status === 'all' ? 'Todos los Estados' : status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="clientFilter" className="text-sm font-medium">Cliente/Organización</Label>
            <Select value={filters.selectedClient} onValueChange={(val) => handleInputChange('selectedClient', val)}>
              <SelectTrigger id="clientFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Organizaciones</SelectItem>
                {clients.map(client => <SelectItem key={client} value={client}>{client}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="environmentFilter" className="text-sm font-medium">Ambiente (Deploy)</Label>
            <Select value={filters.selectedEnvironment} onValueChange={(val) => handleInputChange('selectedEnvironment', val)}>
              <SelectTrigger id="environmentFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Ambientes</SelectItem>
                {environments.map(env => <SelectItem key={env} value={env}>{env}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={resetFilters} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Restablecer Filtros
        </Button>
      </CardContent>
    </Card>
  );
}
