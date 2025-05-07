"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addCommentToTicketAction } from "@/app/actions/jira-actions";
import { Loader2, MessageSquare } from "lucide-react";

const commentFormSchema = z.object({
  commentText: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long (max 1000 characters)."),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  ticketId: string;
  // onCommentAdded?: () => void; // Callback might not be needed if revalidatePath is effective
}

export function CommentForm({ ticketId }: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      commentText: "",
    },
  });

  async function onSubmit(values: CommentFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to comment.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const result = await addCommentToTicketAction(ticketId, user.id, values.commentText);

    if (result.success) {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the ticket.",
      });
      form.reset();
      // if (onCommentAdded) {
      //   onCommentAdded(); 
      // }
    } else {
      toast({
        title: "Error Adding Comment",
        description: result.error || "Could not add your comment.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="commentText"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`commentText-${ticketId}`}>Add a comment</FormLabel>
              <FormControl>
                <Textarea
                  id={`commentText-${ticketId}`}
                  placeholder="Type your comment here..."
                  className="min-h-[100px] resize-y"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Submitting..." : "Submit Comment"}
        </Button>
      </form>
    </Form>
  );
}
