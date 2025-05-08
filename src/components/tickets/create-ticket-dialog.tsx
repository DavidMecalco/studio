
"use client";

import { useState, type ChangeEvent, useEffect, type ReactNode } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createJiraTicketAction } from "@/app/actions/jira-actions";
import type { JiraTicketBranch, JiraTicketPriority, JiraTicketProvider } from "@/services/jira";
import { Plus, FileUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getOrganizations, type Organization } from '@/services/users';


const ticketBranches: JiraTicketBranch[] = ['DEV', 'QA', 'PROD'];
const ticketPriorities: JiraTicketPriority[] = ['Alta', 'Media', 'Baja'];

// Max file size 5MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; 
// Allowed file types (MIME types)
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'application/pdf', 
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

const createTicketFormSchemaBase = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(100, "El título no debe exceder los 100 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000, "La descripción no debe exceder los 1000 caracteres."),
  priority: z.enum(ticketPriorities, {
    required_error: "Seleccione una prioridad.",
  }),
  requestingUserId: z.string().min(1, "El usuario solicitante es obligatorio."),
});

// Schema for admin/superuser users, includes optional provider, branch, and attachments
const adminOrSuperUserCreateTicketFormSchema = createTicketFormSchemaBase.extend({
  provider: z.string().optional(), // Provider/Organization name as string
  branch: z.enum(ticketBranches).optional(),
});

// Schema for client users, provider and branch are not directly input by them
const clientCreateTicketFormSchema = createTicketFormSchemaBase;


type AdminOrSuperUserFormValues = z.infer<typeof adminOrSuperUserCreateTicketFormSchema>;
type ClientFormValues = z.infer<typeof clientCreateTicketFormSchema>;
// Unified form values type for useForm, specific values will be handled by the action
export type CreateTicketDialogFormValues = Partial<AdminOrSuperUserFormValues & ClientFormValues>;

interface CreateTicketDialogProps {
    triggerButton?: ReactNode; // Optional trigger button
}

const NONE_VALUE_SENTINEL = "__NONE_SENTINEL__";

export function CreateTicketDialog({ triggerButton }: CreateTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdminOrSuperUser = user?.role === 'admin' || user?.role === 'superuser';
  const currentFormSchema = isAdminOrSuperUser ? adminOrSuperUserCreateTicketFormSchema : clientCreateTicketFormSchema;

  const form = useForm<CreateTicketDialogFormValues>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: undefined,
      requestingUserId: user?.username || "",
      provider: undefined,
      branch: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        title: "",
        description: "",
        priority: undefined,
        requestingUserId: user.username,
        provider: undefined, 
        branch: undefined,
      });
    }
    if (isOpen && (user?.role === 'admin' || user?.role === 'superuser')) { // Only fetch for admin/superuser
        getOrganizations().then(setOrganizations).catch(err => {
            console.error("Failed to fetch organizations for ticket dialog", err);
            toast({title: "Error", description: "Could not load organizations.", variant: "destructive"});
        });
    }
  }, [user, form, isOpen, toast]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const validFiles = filesArray.filter(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
            title: "Archivo Demasiado Grande",
            description: `El archivo "${file.name}" excede el límite de 5MB.`,
            variant: "destructive",
          });
          return false;
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
           toast({
            title: "Tipo de Archivo No Permitido",
            description: `El tipo de archivo de "${file.name}" no está permitido.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  async function onSubmit(values: CreateTicketDialogFormValues) {
    if (!user) {
        toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const attachmentNames = (user.role === 'admin' || user.role === 'superuser') ? selectedFiles.map(file => file.name) : [];
    
    let providerForAction: JiraTicketProvider | undefined = undefined;
    if (user.role === 'client') {
        providerForAction = user.company;
    } else if (user.role === 'admin' || user.role === 'superuser') {
        providerForAction = values.provider; // This will be undefined if "Ninguna" was selected thanks to onValueChange
    }

    const ticketDataForAction = {
      title: values.title!,
      description: values.description!,
      priority: values.priority!,
      requestingUserId: user.username!,
      provider: providerForAction, 
      branch: (user.role === 'admin' || user.role === 'superuser') ? values.branch : undefined, // This will be undefined if "Ninguna" was selected
      attachmentNames: (user.role === 'admin' || user.role === 'superuser') ? attachmentNames : [],
    };

    const result = await createJiraTicketAction(ticketDataForAction);

    if (result.success && result.ticket) {
      toast({
        title: "Ticket Creado Exitosamente",
        description: `El ticket ${result.ticket.id}: "${result.ticket.title}" ha sido creado.`,
      });
      form.reset();
      setSelectedFiles([]);
      setIsOpen(false);
    } else {
      toast({
        title: "Error al Crear Ticket",
        description: result.error || "No se pudo crear el ticket.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }
  
  if (!user) return null; 

  // Default FAB trigger if no custom trigger is provided
  const defaultTrigger = (
     <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
        size="icon"
        aria-label="Crear nuevo ticket"
        onClick={() => setIsOpen(true)} // Ensure dialog opens
      >
        <Plus className="h-7 w-7" />
      </Button>
  );
  
  // Only show dialog trigger for admin/superusers (clients create from My Tickets page)
  const canDisplayTrigger = user.role === 'admin' || user.role === 'superuser';


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {canDisplayTrigger && (
            <DialogTrigger asChild>
                {triggerButton || defaultTrigger}
            </DialogTrigger>
        )}
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Complete los detalles a continuación para crear un nuevo ticket.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Corregir error en inicio de sesión" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requestingUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario Solicitante</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly disabled value={user.username} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el problema o la característica en detalle..."
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ticketPriorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(user.role === 'admin' || user.role === 'superuser') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider" // This is the organization/company name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organización (Proveedor)</FormLabel>
                        <Select 
                            onValueChange={(selectedValue) => {
                                field.onChange(selectedValue === NONE_VALUE_SENTINEL ? undefined : selectedValue);
                            }} 
                            value={field.value || NONE_VALUE_SENTINEL}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione organización" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value={NONE_VALUE_SENTINEL}>-- Ninguna --</SelectItem>
                            {organizations.map(org => (
                              <SelectItem key={org.id} value={org.name}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select 
                            onValueChange={(selectedValue) => {
                                field.onChange(selectedValue === NONE_VALUE_SENTINEL ? undefined : selectedValue);
                            }} 
                            value={field.value || NONE_VALUE_SENTINEL}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value={NONE_VALUE_SENTINEL}>-- Ninguna --</SelectItem>
                            {ticketBranches.map(branch => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              
                <FormItem>
                  <FormLabel htmlFor="attachments">Adjuntos (opcional, máx. 5 archivos, 5MB cada uno)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                        <Input
                            id="attachments"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            accept={ALLOWED_MIME_TYPES.join(',')}
                            disabled={selectedFiles.length >= 5}
                        />
                         <FileUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </FormControl>
                   {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium">Archivos seleccionados:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {selectedFiles.map(file => (
                          <li key={file.name} className="flex justify-between items-center">
                            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="text-destructive">X</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                   {selectedFiles.length >= 5 && (
                    <p className="text-xs text-destructive mt-1">Ha alcanzado el límite de 5 archivos.</p>
                  )}
                  <FormMessage />
                </FormItem>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); setSelectedFiles([]); setIsOpen(false); }} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Creando Ticket..." : "Crear Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    