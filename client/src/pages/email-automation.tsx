import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getStatusColor } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader, Mail, Users, FileText } from "lucide-react";

interface Template {
  id: number;
  type: string;
  subject: string;
  body: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  status: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

interface EmailLog {
  id: number;
  candidateId: number;
  templateId: number;
  subject: string;
  body: string;
  sentAt: string;
  status: string;
}

const EmailAutomation = () => {
  const { toast } = useToast();
  
  // Queries
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/email-templates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: emailLogs, isLoading: isLoadingEmailLogs, refetch: refetchEmailLogs } = useQuery({
    queryKey: ["/api/email-logs"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | "">("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({
    interview_date: "",
    interview_time: "",
  });
  
  // New template form state
  const [newTemplateType, setNewTemplateType] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState("compose");
  
  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/send-email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      
      // Reset form
      setSelectedCandidateId("");
      setSelectedTemplateId("");
      setEmailSubject("");
      setEmailBody("");
      setCustomFields({
        interview_date: "",
        interview_time: "",
      });
      
      // Refresh email logs
      refetchEmailLogs();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send email: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/email-templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "Your email template has been created successfully.",
      });
      
      // Reset form
      setNewTemplateType("");
      setNewTemplateSubject("");
      setNewTemplateBody("");
      
      // Switch to compose tab
      setActiveTab("compose");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleTemplateChange = (value: string) => {
    const templateId = value ? parseInt(value) : "";
    setSelectedTemplateId(templateId);
    
    if (templateId !== "") {
      const template = templates?.find((t: Template) => t.id === templateId);
      
      if (template) {
        let subject = template.subject;
        let body = template.body;
        
        // Replace placeholders with actual values if candidate is selected
        if (selectedCandidateId !== "") {
          const candidate = candidates?.find((c: Candidate) => c.id === selectedCandidateId);
          const job = candidate ? jobs?.find((j: Job) => j.id === candidate.jobId) : null;
          
          if (candidate && job) {
            subject = subject.replace("{{position}}", job.title);
            body = body.replace("{{candidate_name}}", candidate.name)
              .replace("{{position}}", job.title);
            
            // Apply custom fields
            Object.entries(customFields).forEach(([key, value]) => {
              subject = subject.replace(`{{${key}}}`, value);
              body = body.replace(`{{${key}}}`, value);
            });
          }
        }
        
        setEmailSubject(subject);
        setEmailBody(body);
      }
    } else {
      setEmailSubject("");
      setEmailBody("");
    }
  };
  
  const handleCandidateChange = (value: string) => {
    const candidateId = value ? parseInt(value) : "";
    setSelectedCandidateId(candidateId);
    
    // If template is already selected, update subject and body with candidate info
    if (selectedTemplateId !== "") {
      handleTemplateChange(selectedTemplateId.toString());
    }
  };
  
  const handleCustomFieldChange = (name: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update email subject and body with new custom field value
    if (selectedTemplateId !== "") {
      const template = templates?.find((t: Template) => t.id === selectedTemplateId);
      
      if (template) {
        let subject = emailSubject;
        let body = emailBody;
        
        subject = subject.replace(`{{${name}}}`, value);
        body = body.replace(`{{${name}}}`, value);
        
        setEmailSubject(subject);
        setEmailBody(body);
      }
    }
  };
  
  const handleSendEmail = () => {
    if (!selectedTemplateId || !selectedCandidateId) {
      toast({
        title: "Missing information",
        description: "Please select both a template and a candidate.",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailMutation.mutate({
      candidateId: selectedCandidateId,
      templateType: templates?.find((t: Template) => t.id === selectedTemplateId)?.type,
      customizations: customFields
    });
  };
  
  const handleCreateTemplate = () => {
    if (!newTemplateType || !newTemplateSubject || !newTemplateBody) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    createTemplateMutation.mutate({
      type: newTemplateType,
      subject: newTemplateSubject,
      body: newTemplateBody
    });
  };
  
  const getCandidateName = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  const getTemplateName = (templateId: number) => {
    const template = templates?.find((t: Template) => t.id === templateId);
    return template ? `${template.type} (ID: ${template.id})` : "Unknown Template";
  };
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Email Automation
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Send personalized emails to candidates using Llama 3.x AI
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose Email</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="logs">Email Logs</TabsTrigger>
          </TabsList>
          
          {/* Compose Email Tab */}
          <TabsContent value="compose">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Email Form */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Select Template & Candidate
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Email Template</Label>
                    <Select value={selectedTemplateId.toString()} onValueChange={handleTemplateChange}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingTemplates ? (
                          <div className="p-2 text-center">Loading templates...</div>
                        ) : (
                          templates?.map((template: Template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.type.charAt(0).toUpperCase() + template.type.slice(1).replace(/_/g, ' ')}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="candidate">Candidate</Label>
                    <Select value={selectedCandidateId.toString()} onValueChange={handleCandidateChange}>
                      <SelectTrigger id="candidate">
                        <SelectValue placeholder="Select a candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCandidates ? (
                          <div className="p-2 text-center">Loading candidates...</div>
                        ) : (
                          candidates?.map((candidate: Candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id.toString()}>
                              {candidate.name} - {candidate.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTemplateId !== "" && selectedCandidateId !== "" && (
                    <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700">Custom Fields</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="interview_date" className="text-xs">Interview Date</Label>
                          <Input
                            id="interview_date"
                            placeholder="e.g. May 15, 2023"
                            value={customFields.interview_date}
                            onChange={(e) => handleCustomFieldChange("interview_date", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="interview_time" className="text-xs">Interview Time</Label>
                          <Input
                            id="interview_time"
                            placeholder="e.g. 2:30 PM"
                            value={customFields.interview_time}
                            onChange={(e) => handleCustomFieldChange("interview_time", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={handleSendEmail}
                    className="w-full"
                    disabled={!selectedTemplateId || !selectedCandidateId || sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Email Preview */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Email Preview
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {!emailSubject && !emailBody ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a template and candidate to preview the email.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          {emailSubject}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Body</Label>
                        <div 
                          className="p-3 bg-gray-50 rounded-md text-gray-700"
                          dangerouslySetInnerHTML={{ __html: emailBody.replace(/\n/g, '<br/>') }}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Email Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Templates List */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Available Templates
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {isLoadingTemplates ? (
                    <div className="flex justify-center py-4">
                      <Loader className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : templates?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>No email templates available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {templates?.map((template: Template) => (
                        <div key={template.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-700">
                              {template.type.charAt(0).toUpperCase() + template.type.slice(1).replace(/_/g, ' ')}
                            </h4>
                            <Badge variant="outline">{`ID: ${template.id}`}</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Subject:</p>
                          <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                          <p className="text-sm font-medium text-gray-600 mb-1">Body:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{template.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Create Template Form */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Create New Template
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_type">Template Type</Label>
                    <Input
                      id="template_type"
                      placeholder="e.g. interview_invitation, rejection, offer"
                      value={newTemplateType}
                      onChange={(e) => setNewTemplateType(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Use snake_case for type names</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template_subject">Subject</Label>
                    <Input
                      id="template_subject"
                      placeholder="e.g. Interview Invitation for {{position}}"
                      value={newTemplateSubject}
                      onChange={(e) => setNewTemplateSubject(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Use {{placeholders}} for dynamic content</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template_body">Body</Label>
                    <Textarea
                      id="template_body"
                      placeholder="e.g. Dear {{candidate_name}},\n\nWe would like to invite you for an interview..."
                      rows={6}
                      value={newTemplateBody}
                      onChange={(e) => setNewTemplateBody(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Available placeholders: {{candidate_name}}, {{position}}, {{interview_date}}, {{interview_time}}</p>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={handleCreateTemplate}
                    className="w-full"
                    disabled={!newTemplateType || !newTemplateSubject || !newTemplateBody || createTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Create Template
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Email Logs Tab */}
          <TabsContent value="logs">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Email History
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingEmailLogs ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : emailLogs?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No email logs available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailLogs?.map((log: EmailLog) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(log.sentAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getCandidateName(log.candidateId)}</TableCell>
                            <TableCell>{getTemplateName(log.templateId)}</TableCell>
                            <TableCell>{log.subject}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="justify-between">
                <div className="text-sm text-gray-500">
                  {emailLogs?.length || 0} emails sent
                </div>
                <Button variant="outline" onClick={() => refetchEmailLogs()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailAutomation;
