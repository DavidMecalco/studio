

"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, RotateCcw, Search } from 'lucide-react';
import type { JiraTicketStatus, JiraTicketPriority, JiraTicketType } from '@/services/jira'; // Added JiraTicketType
import { JIRA_TICKET_TYPES } from '@/services/jira'; // Import defined types
import { format, subDays } from 'date-fns';

export interface MyTicketsFilters {
  dateFrom: string;
  dateTo: string;
  status: JiraTicketStatus | 'all';
  priority: JiraTicketPriority | 'all';
  type: JiraTicketType | 'all'; // Added type filter
  searchTerm: string;
}

interface MyTicketsFilterBarProps {
  filters: MyTicketsFilters;
  onFiltersChange: Dispatch<SetStateAction<MyTicketsFilters>>;
}

const ticketStatuses: Array<JiraTicketStatus | 'all'> = ['all', 'Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno', 'Reabierto'];
const ticketPriorities: Array<JiraTicketPriority | 'all'> = ['all', 'Alta', 'Media', 'Baja'];
const ticketTypesForFilter: Array<JiraTicketType | 'all'> = ['all', ...JIRA_TICKET_TYPES];


export function MyTicketsFilterBar({ filters, onFiltersChange }: MyTicketsFilterBarProps) {

  const handleInputChange = (filterName: keyof MyTicketsFilters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: '', 
      dateTo: '', 
      status: 'all',
      priority: 'all',
      type: 'all', // Reset type filter
      searchTerm: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtrar Mis Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end"> {/* Adjusted grid */}
          <div>
            <Label htmlFor="myTicketsDateFromFilter" className="text-sm font-medium">Desde</Label>
            <Input id="myTicketsDateFromFilter" type="date" value={filters.dateFrom} onChange={(e) => handleInputChange('dateFrom', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="myTicketsDateToFilter" className="text-sm font-medium">Hasta</Label>
            <Input id="myTicketsDateToFilter" type="date" value={filters.dateTo} onChange={(e) => handleInputChange('dateTo', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="myTicketsStatusFilter" className="text-sm font-medium">Estado</Label>
            <Select value={filters.status} onValueChange={(val) => handleInputChange('status', val)}>
              <SelectTrigger id="myTicketsStatusFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketStatuses.map(status => <SelectItem key={status} value={status}>{status === 'all' ? 'Todos los Estados' : status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="myTicketsPriorityFilter" className="text-sm font-medium">Prioridad</Label>
            <Select value={filters.priority} onValueChange={(val) => handleInputChange('priority', val)}>
              <SelectTrigger id="myTicketsPriorityFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketPriorities.map(priority => <SelectItem key={priority} value={priority}>{priority === 'all' ? 'Todas las Prioridades' : priority}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="myTicketsTypeFilter" className="text-sm font-medium">Tipo</Label>
            <Select value={filters.type} onValueChange={(val) => handleInputChange('type', val)}>
              <SelectTrigger id="myTicketsTypeFilter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ticketTypesForFilter.map(type => <SelectItem key={type} value={type}>{type === 'all' ? 'Todos los Tipos' : type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-2"> {/* Search term takes more space */}
            <Label htmlFor="myTicketsSearchTermFilter" className="text-sm font-medium">Buscar (Título, ID, Descripción)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="myTicketsSearchTermFilter" 
                type="search" 
                placeholder="ID, palabra clave..." 
                value={filters.searchTerm} 
                onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
           <div className="self-end xl:col-start-1"> {/* Ensure reset button aligns nicely */}
            <Button onClick={resetFilters} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
