
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
import { GitCommit, Loader2, RefreshCcw } from "lucide-react";
import type { JiraTicketStatus } from "@/services/jira";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import type { GitHubCommit } from "@/services/github";
import { Separator } from "@/components/ui/separator";

const availableBranches = ["dev", "main", "staging", "qa", "fix/current-issue", "feat/new-feature"] as const;

const commitFormSchema = z.object({
  commitMessage: z.string().min(5, "El mensaje de commit debe tener al menos 5 caracteres."),
  branch: z.enum(availableBranches, {
    required_error: "La rama es obligatoria."
  }).default("dev"),
});

type CommitFormValues = z.infer<typeof commitFormSchema>;

interface CommitChangesFormProps {
  ticketId: string;
  currentTicketStatus: JiraTicketStatus;
  allCommits?: GitHubCommit[]; // Added to receive all commits for the ticket/repo
}

export function CommitChangesForm({ ticketId, currentTicketStatus, allCommits = [] }: CommitChangesFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommitForRestore, setSelectedCommitForRestore] = useState<string | null>(null);
  const [isRestoringCommit, setIsRestoringCommit] = useState(false);

  const form = useForm<CommitFormValues>({
    resolver: zodResolver(commitFormSchema),
    defaultValues: {
      commitMessage: "",
      branch: "dev",
    },
  });

  async function onSubmit(values: CommitFormValues) {
    if (!user) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const newStatusForTicket: JiraTicketStatus = "En Progreso";

    const result = await createCommitAndPushAction(
      ticketId,
      values.commitMessage,
      user.username,
      values.branch,
      newStatusForTicket
    );

    if (result.success && result.commit) {
      toast({
        title: "Commit Realizado Exitosamente (Simulado)",
        description: `Commit ${result.commit.sha.substring(0,7)} para el ticket ${ticketId} en la rama ${values.branch}. Ticket actualizado a "${newStatusForTicket}".`,
      });
      form.reset();
    } else {
      toast({
        title: "Error al Realizar Commit",
        description: result.error || "No se pudo realizar el commit.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const handleRestoreCommit = async () => {
    if (!selectedCommitForRestore || !user) {
      toast({ title: "Error", description: "Seleccione un commit y asegúrese de estar autenticado.", variant: "destructive" });
      return;
    }
    setIsRestoringCommit(true);
    // Simulate server action
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Restauración a Commit (Simulada)",
      description: `Se ha simulado la restauración al commit ${selectedCommitForRestore.substring(0,7)}. En un caso real, se crearía una nueva rama 'restore-${ticketId}-${selectedCommitForRestore.substring(0,4)}' o se revertirían los cambios.`,
      duration: 5000,
    });
    setIsRestoringCommit(false);
    setSelectedCommitForRestore(null);
  };
  
  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCommit className="h-5 w-5 text-primary" /> Registrar Cambios y Commit
        </CardTitle>
        <CardDescription>
          Ingrese un mensaje de commit y envíe los cambios. El ticket se actualizará a "En Progreso".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="commitMessage"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="commitMessage">Mensaje de Commit (Ej: feat(script) Validación de fechas WO)</Label>
                  <FormControl>
                    <Textarea
                      id="commitMessage"
                      placeholder="Describa los cambios realizados..."
                      className="min-h-[100px] mt-1"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="branch">Rama (Branch)</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value} // Ensure value is controlled
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Seleccione una rama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBranches.map((branchName) => (
                        <SelectItem key={branchName} value={branchName}>
                          {branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCommit className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Realizando Commit..." : "Commit y Push a Branch"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            Los cambios se enviarán (simuladamente) al repositorio asociado con este ticket.
        </p>
      </CardFooter>

      {allCommits && allCommits.length > 0 && (
        <>
          <Separator className="my-6" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCcw className="h-5 w-5 text-primary" /> Trabajar con Commit Anterior
            </CardTitle>
            <CardDescription>
              Seleccione un commit para ver su estado, crear una nueva rama desde él, o restaurar (revertir) a esta versión (simulado).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormItem>
              <Label htmlFor="selectCommitForRestore">Seleccionar Commit para Restaurar/Trabajar</Label>
              <Select
                value={selectedCommitForRestore || ""}
                onValueChange={setSelectedCommitForRestore}
                disabled={isRestoringCommit}
              >
                <SelectTrigger id="selectCommitForRestore">
                  <SelectValue placeholder="Elija un commit..." />
                </SelectTrigger>
                <SelectContent>
                  {allCommits.map((commit) => (
                    <SelectItem key={commit.sha} value={commit.sha}>
                      {commit.sha.substring(0, 7)} - {commit.message.length > 50 ? `${commit.message.substring(0, 47)}...` : commit.message}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <Button
              onClick={handleRestoreCommit}
              disabled={!selectedCommitForRestore || isRestoringCommit}
              variant="outline"
            >
              {isRestoringCommit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              {isRestoringCommit ? "Restaurando..." : "Restaurar/Revertir a este Commit (Simulado)"}
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
                Esta acción simulará la restauración o creación de una rama desde el commit seleccionado.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
