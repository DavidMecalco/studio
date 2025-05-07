
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileArchive, FileCode2, FileText, Upload, Download, Trash2, FileIcon, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileVersionHistoryDialog } from "./file-version-history-dialog"; // Import the new dialog

interface ManagedFile {
  id: string;
  name: string;
  type: "py" | "xml" | "zip" | "unknown";
  size: string; // e.g., "1.2MB"
  lastModified: string; // e.g., "2023-10-26"
  ticketId?: string; // Optional: Associate file with a ticket for history context
}

// Mock data for downloadable files
const mockFiles: ManagedFile[] = [
  { id: "1", name: "automation_script_v1.py", type: "py", size: "12KB", lastModified: "2024-07-01", ticketId: "MAX-123" },
  { id: "2", name: "integration_config.xml", type: "xml", size: "5KB", lastModified: "2024-06-28", ticketId: "MAX-123" },
  { id: "3", name: "maximo_customizations_pkg.zip", type: "zip", size: "2.3MB", lastModified: "2024-07-02" },
  { id: "4", name: "another_script.py", type: "py", size: "25KB", lastModified: "2024-07-03", ticketId: "MAX-456" },
];


export function FileManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [managedFiles, setManagedFiles] = useState<ManagedFile[]>(mockFiles);
  const { toast } = useToast();

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedFileForHistory, setSelectedFileForHistory] = useState<ManagedFile | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ["text/x-python", "application/python", "text/xml", "application/xml", "application/zip", "application/x-zip-compressed", "text/plain", ".rptdesign"]; // Added plain text and rptdesign extension
      const allowedExtensions = [".py", ".xml", ".zip", ".txt", ".rptdesign"];
      
      const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid File Type",
          description: `Please select a .py, .xml, .zip, .txt, or .rptdesign file. Detected type: ${file.type}, extension: ${fileExtension}`,
          variant: "destructive",
        });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUploading(false);

    const newFile: ManagedFile = {
        id: String(Date.now()),
        name: selectedFile.name,
        type: selectedFile.name.endsWith('.py') ? 'py' 
            : selectedFile.name.endsWith('.xml') ? 'xml' 
            : selectedFile.name.endsWith('.zip') ? 'zip' 
            : 'unknown', // Add more types if needed, e.g. for rptdesign
        size: `${(selectedFile.size / 1024).toFixed(1)}KB`,
        lastModified: new Date().toLocaleDateString(),
    }
    setManagedFiles(prev => [newFile, ...prev]);

    toast({
      title: "Upload Successful",
      description: `${selectedFile.name} has been uploaded. (Simulated)`,
    });
    setSelectedFile(null);
    const form = event.target as HTMLFormElement;
    form.reset();
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}... (Simulated)`,
    });
  };

  const handleDelete = (fileId: string) => {
    setManagedFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File Deleted",
      description: `File has been deleted. (Simulated)`,
    });
  };

  const handleShowHistory = (file: ManagedFile) => {
    setSelectedFileForHistory(file);
    setIsHistoryDialogOpen(true);
  };


  const getFileIcon = (type: ManagedFile["type"]) => {
    switch (type) {
      case "py": return <FileCode2 className="h-5 w-5 text-blue-500" />;
      case "xml": return <FileText className="h-5 w-5 text-green-500" />; // Ensure FileText is used for xml consistently
      case "zip": return <FileArchive className="h-5 w-5 text-orange-500" />;
      // Add case for .rptdesign if needed, e.g. using FileIcon or a specific one
      default: return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload New File</CardTitle>
          <CardDescription>Upload .py, .xml, .zip, .txt, or .rptdesign files for Maximo configurations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input type="file" onChange={handleFileChange} accept=".py,.xml,.zip,.txt,.rptdesign" />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileIcon className="h-5 w-5" /> Managed Files</CardTitle>
          <CardDescription>Download, manage, or view version history of configuration files.</CardDescription>
        </CardHeader>
        <CardContent>
          {managedFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{getFileIcon(file.type)}</TableCell>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.lastModified}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleShowHistory(file)}>
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(file.name)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {file.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No files managed yet.</p>
          )}
        </CardContent>
      </Card>

      {selectedFileForHistory && (
        <FileVersionHistoryDialog
          fileName={selectedFileForHistory.name}
          isOpen={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
          ticketId={selectedFileForHistory.ticketId}
        />
      )}
    </div>
  );
}
