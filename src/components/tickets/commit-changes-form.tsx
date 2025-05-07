
"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createCommitAndPushAction } from "@/app/actions/github-actions";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommit, UploadCloud, Loader2, FileText } from "lucide-react";
import type { JiraTicketStatus } from "@/services/jira";

const commitFormSchema = z.object({
  commitMessage: z.string().min(5, "El mensaje de commit debe tener al menos 5 caracteres."),
  branch: z.string().min(1, "La rama es obligatoria.").default("dev"), // Default to dev branch
});

type CommitFormValues = z.infer<typeof commitFormSchema>;

interface CommitChangesFormProps {
  ticketId: string;
  currentTicketStatus: JiraTicketStatus;
}

// Max file size 2MB for simulation
const MAX_FILE_SIZE_BYTES_SIM = 2 * 1024 * 1024; 
const ALLOWED_MIME_TYPES_SIM = [
  'text/x-python', 'application/python', 
  'text/xml', 'application/xml', 
  'application/zip', 'application/octet-stream' // for other binary files
];


export function CommitChangesForm({ ticketId, currentTicketStatus }: CommitChangesFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommitFormValues>({
    resolver: zodResolver(commitFormSchema),
    defaultValues: {
      commitMessage: "",
      branch: "dev",
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const validFiles = filesArray.filter(file => {
        if (file.size > MAX_FILE_SIZE_BYTES_SIM) {
          toast({
            title: "Archivo Demasiado Grande (Simulación)",
            description: `El archivo "${file.name}" excede el límite de 2MB.`,
            variant: "destructive",
          });
          return false;
        }
        // Basic MIME type check for simulation, real app might need more robust validation
        // For broader acceptance in simulation, let's be more permissive or rely on extensions
        const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        const commonCodeExtensions = ['.py', '.xml', '.js', '.ts', '.java', '.cs', '.json', '.yaml', '.yml', '.txt', '.md'];
        
        if (!ALLOWED_MIME_TYPES_SIM.includes(file.type) && !commonCodeExtensions.includes(fileExtension) && fileExtension !== '.zip') {
           toast({
            title: "Tipo de Archivo No Permitido (Simulación)",
            description: `El tipo de archivo de "${file.name}" no parece ser un archivo de código, script, XML o ZIP común.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      }).slice(0, 5 - selectedFiles.length); // Limit to 5 files total

      setSelectedFiles(prev => [...prev, ...validFiles].slice(0,5));
      if (filesArray.length + selectedFiles.length > 5) {
        toast({
            title: "Límite de Archivos Alcanzado",
            description: `Solo se pueden subir hasta 5 archivos. Se ignoraron los adicionales.`,
            variant: "destructive",
        })
      }
       // Reset file input to allow re-selecting the same file if removed
      event.target.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  async function onSubmit(values: CommitFormValues) {
    if (!user) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    if (selectedFiles.length === 0) {
        toast({ title: "Sin Archivos", description: "Por favor, suba al menos un archivo modificado.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    const fileNames = selectedFiles.map(file => file.name);
    const newStatusForTicket: JiraTicketStatus = "En Progreso";

    const result = await createCommitAndPushAction(
      ticketId,
      values.commitMessage,
      user.username,
      fileNames,
      values.branch,
      newStatusForTicket
    );

    if (result.success && result.commit) {
      toast({
        title: "Commit Realizado Exitosamente (Simulado)",
        description: `Commit ${result.commit.sha.substring(0,7)} para el ticket ${ticketId} en la rama ${values.branch}. Ticket actualizado a "${newStatusForTicket}".`,
      });
      form.reset();
      setSelectedFiles([]);
    } else {
      toast({
        title: "Error al Realizar Commit",
        description: result.error || "No se pudo realizar el commit.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }
  
  // Technicians (admins) can commit. If ticket is already resolved/closed, maybe disable?
  // For now, let's allow committing even if closed, as it might be a post-fix or docs update.
  // const canCommit = currentTicketStatus !== 'Resuelto' && currentTicketStatus !== 'Cerrado';


  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCommit className="h-5 w-5 text-primary" /> Registrar Cambios y Commit
        </CardTitle>
        <CardDescription>
          Suba los archivos modificados, ingrese un mensaje de commit y envíe los cambios. El ticket se actualizará a "En Progreso".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="commitMessage">Mensaje de Commit (Ej: feat(script) Validación de fechas WO)</Label>
            <Textarea
              id="commitMessage"
              placeholder="Describa los cambios realizados..."
              className="min-h-[100px] mt-1"
              {...form.register("commitMessage")}
              disabled={isSubmitting}
            />
            {form.formState.errors.commitMessage && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.commitMessage.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="branch">Rama (Branch)</Label>
            <Input
              id="branch"
              placeholder="dev"
              className="mt-1"
              {...form.register("branch")}
              disabled={isSubmitting}
            />
             {form.formState.errors.branch && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.branch.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="files">Archivos Modificados (Simulado, máx. 5 archivos, 2MB c/u)</Label>
            <div className="mt-1 flex items-center gap-2">
                <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                accept=".py,.xml,.zip,.js,.ts,.java,.cs,.json,.yaml,.yml,.txt,.md,application/octet-stream"
                disabled={selectedFiles.length >= 5 || isSubmitting}
                />
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>

            {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">Archivos seleccionados para commit:</p>
              <ul className="list-none space-y-1">
                {selectedFiles.map(file => (
                  <li key={file.name} className="flex justify-between items-center text-sm p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground"/>
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="text-destructive hover:text-destructive/80" disabled={isSubmitting}>X</Button>
                  </li>
                ))}
              </ul>
            </div>
            )}
            {selectedFiles.length >= 5 && (
            <p className="text-xs text-destructive mt-1">Ha alcanzado el límite de 5 archivos.</p>
            )}
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || selectedFiles.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCommit className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Realizando Commit..." : "Commit y Push a Branch"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            Los cambios se enviarán (simuladamente) al repositorio asociado con este ticket.
        </p>
      </CardFooter>
    </Card>
  );
}
