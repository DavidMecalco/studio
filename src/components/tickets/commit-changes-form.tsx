
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
import { GitCommit, Loader2 } from "lucide-react";
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

export function CommitChangesForm({ ticketId, currentTicketStatus }: CommitChangesFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // fileNames are no longer passed to createCommitAndPushAction
    const result = await createCommitAndPushAction(
      ticketId,
      values.commitMessage,
      user.username,
      // fileNames, // Removed
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
          
          {/* File input section removed as per user request */}

          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
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
