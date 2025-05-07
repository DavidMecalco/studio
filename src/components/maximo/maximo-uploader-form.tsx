
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MaximoConfiguration } from "@/services/maximo";
import { uploadMaximoConfigurationAction } from "@/app/actions/maximo-actions";

const formSchema = z.object({
  name: z.string().min(1, "Configuration name is required."),
  type: z.enum(["script", "xml"], {
    required_error: "Configuration type is required.",
  }),
  content: z.string().min(1, "Configuration content is required."),
  // Optional file upload if content is not directly pasted
  // file: z.instanceof(File).optional(), 
});

type MaximoUploaderFormValues = z.infer<typeof formSchema>;

export function MaximoUploaderForm() {
  const { toast } = useToast();
  const form = useForm<MaximoUploaderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "script",
      content: "",
    },
  });

  async function onSubmit(values: MaximoUploaderFormValues) {
    const configuration: MaximoConfiguration = {
      name: values.name,
      type: values.type,
      content: values.content, // If handling file uploads, read content here
    };

    try {
      const result = await uploadMaximoConfigurationAction(configuration);
      if (result.success) {
        toast({
          title: "Success",
          description: "Configuration uploaded to Maximo.",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to upload configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5" /> Upload Maximo Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CustomScript123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="script">Python Script (.py)</SelectItem>
                      <SelectItem value="xml">XML Configuration (.xml)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your script or XML content here..."
                      className="min-h-[200px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TODO: Implement file upload alternative to pasting content */}
            {/* <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Or Upload File (.py, .xml)</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".py,.xml" onChange={(e) => field.onChange(e.target.files?.[0])} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Uploading..." : "Upload to Maximo"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

