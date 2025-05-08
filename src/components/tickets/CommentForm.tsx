
"use client";

import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // Added for file input
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addCommentToTicketAction } from "@/app/actions/jira-actions";
import { Loader2, MessageSquare, Paperclip, Code2, X } from "lucide-react";

const commentFormSchema = z.object({
  commentText: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long (max 1000 characters)."),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  ticketId: string;
}

const MAX_FILES_COMMENT = 3;
const MAX_FILE_SIZE_COMMENT_BYTES = 2 * 1024 * 1024; // 2MB per file

export function CommentForm({ ticketId }: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      commentText: "",
    },
  });

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const currentTotal = selectedFiles.length + newFiles.length;

      if (currentTotal > MAX_FILES_COMMENT) {
        toast({
          title: "Too many files",
          description: `You can attach a maximum of ${MAX_FILES_COMMENT} files.`,
          variant: "destructive",
        });
        event.target.value = ""; // Clear the file input
        return;
      }

      const validNewFiles = newFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE_COMMENT_BYTES) {
          toast({
            title: "File too large",
            description: `File "${file.name}" exceeds the 2MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      
      setSelectedFiles(prev => [...prev, ...validNewFiles].slice(0, MAX_FILES_COMMENT));
      event.target.value = ""; // Clear the file input to allow re-selecting same file if removed
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleAddCodeSnippet = () => {
    toast({
      title: "Add Code Snippet (Simulated)",
      description: "This feature is under development. You would be able to paste or write code here.",
    });
    // In a real scenario, this might open a modal with a code editor
    // and append the formatted code to the commentText or handle it separately.
  };


  async function onSubmit(values: CommentFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to comment.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const attachmentNames = selectedFiles.map(file => file.name);
    // Actual file upload would happen here or be handled by the action.
    // For now, we're just passing names.

    const result = await addCommentToTicketAction(ticketId, user.id, values.commentText, attachmentNames);

    if (result.success) {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the ticket.",
      });
      form.reset();
      setSelectedFiles([]);
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

        {/* File and Code attachment buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => document.getElementById(`file-input-${ticketId}`)?.click()}
              title="Attach files"
              disabled={isSubmitting || selectedFiles.length >= MAX_FILES_COMMENT}
            >
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Attach files</span>
            </Button>
            <Input
              id={`file-input-${ticketId}`}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" // Example file types
              disabled={selectedFiles.length >= MAX_FILES_COMMENT}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddCodeSnippet}
              title="Add code snippet"
              disabled={isSubmitting}
            >
              <Code2 className="h-4 w-4" />
              <span className="sr-only">Add code snippet</span>
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Attached files ({selectedFiles.length}/{MAX_FILES_COMMENT}):</p>
              <ul className="list-none space-y-1">
                {selectedFiles.map(file => (
                  <li key={file.name} className="flex items-center justify-between text-xs p-1.5 border rounded-md bg-muted/50">
                    <span className="truncate max-w-[200px]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:bg-destructive/10"
                      onClick={() => removeFile(file.name)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {file.name}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
