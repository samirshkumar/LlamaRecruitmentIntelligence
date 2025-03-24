import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader, Save, Key, RefreshCcw } from "lucide-react";

// Define schema for API key settings
const apiKeyFormSchema = z.object({
  llamaApiKey: z.string().min(1, "API key is required"),
  useTestMode: z.boolean().default(false),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

// Define schema for general settings
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  emailNotifications: z.boolean().default(true),
  autoSaveInterviews: z.boolean().default(true),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isTesting, setIsTesting] = useState(false);

  // Query to fetch current settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // API key form
  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      llamaApiKey: "",
      useTestMode: false,
    },
  });

  // General settings form
  const generalSettingsForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "",
      emailNotifications: true,
      autoSaveInterviews: true,
    },
  });

  // Set form values when settings data is loaded
  useEffect(() => {
    if (settings) {
      // API key settings
      apiKeyForm.reset({
        llamaApiKey: settings.llamaApiKey || "",
        useTestMode: settings.useTestMode || false,
      });

      // General settings
      generalSettingsForm.reset({
        companyName: settings.companyName || "",
        emailNotifications: settings.emailNotifications !== false,
        autoSaveInterviews: settings.autoSaveInterviews !== false,
      });
    }
  }, [settings, apiKeyForm, generalSettingsForm]);

  // Mutation to update API key settings
  const saveApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyFormValues) => {
      const response = await apiRequest("POST", "/api/settings/api-key", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: "API Key Updated",
        description: "Your Llama API key has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update API key: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to update general settings
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsValues) => {
      const response = await apiRequest("POST", "/api/settings/general", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: "Settings Updated",
        description: "Your general settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Test API key functionality
  const testApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      setIsTesting(true);
      const response = await apiRequest("POST", "/api/settings/test-api-key", { apiKey });
      return response.json();
    },
    onSuccess: (data) => {
      setIsTesting(false);
      
      if (data.success) {
        toast({
          title: "API Key Valid",
          description: "Your Llama API key is valid and working properly.",
        });
      } else {
        toast({
          title: "API Key Invalid",
          description: data.error || "There was an issue with your API key.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsTesting(false);
      
      toast({
        title: "Test Failed",
        description: "Could not test API key. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmitApiKey = (values: ApiKeyFormValues) => {
    saveApiKeyMutation.mutate(values);
  };

  const onSubmitGeneralSettings = (values: GeneralSettingsValues) => {
    saveGeneralSettingsMutation.mutate(values);
  };

  const handleTestApiKey = () => {
    const apiKey = apiKeyForm.getValues().llamaApiKey;
    
    if (!apiKey) {
      toast({
        title: "No API Key",
        description: "Please enter an API key before testing.",
        variant: "destructive",
      });
      return;
    }
    
    testApiKeyMutation.mutate(apiKey);
  };

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Settings
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Configure your recruitment platform settings
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="apiKey">API Configuration</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure general platform settings
                </CardDescription>
              </CardHeader>
              
              <Form {...generalSettingsForm}>
                <form onSubmit={generalSettingsForm.handleSubmit(onSubmitGeneralSettings)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={generalSettingsForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your company name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will appear on all communications sent to candidates.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                      
                      <FormField
                        control={generalSettingsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex justify-between items-center rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive email notifications for interview schedule changes.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalSettingsForm.control}
                        name="autoSaveInterviews"
                        render={({ field }) => (
                          <FormItem className="flex justify-between items-center rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-base">Auto-Save Interviews</FormLabel>
                              <FormDescription>
                                Automatically save interview progress every minute.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t p-4">
                    <Button
                      type="submit"
                      disabled={!generalSettingsForm.formState.isDirty || generalSettingsForm.formState.isSubmitting || saveGeneralSettingsMutation.isPending}
                    >
                      {saveGeneralSettingsMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* API Key Tab */}
          <TabsContent value="apiKey">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Llama 3.x API key and other integration settings
                </CardDescription>
              </CardHeader>
              
              <Form {...apiKeyForm}>
                <form onSubmit={apiKeyForm.handleSubmit(onSubmitApiKey)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={apiKeyForm.control}
                      name="llamaApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Llama 3.x API Key</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <div className="relative flex-1">
                                <Input 
                                  type="password" 
                                  placeholder="Enter your Llama API key" 
                                  className="pr-10 flex-1" 
                                  {...field} 
                                />
                                <Key className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                              </div>
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={handleTestApiKey}
                              disabled={isTesting || !field.value}
                            >
                              {isTesting ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCcw className="mr-2 h-3 w-3" />
                                  Test
                                </>
                              )}
                            </Button>
                          </div>
                          <FormDescription>
                            Enter your Llama 3.x API key to enable AI-powered recruitment features.
                            <a 
                              href="https://llama.example.com/get-api-key" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-1 text-primary hover:underline"
                            >
                              Get an API key
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={apiKeyForm.control}
                      name="useTestMode"
                      render={({ field }) => (
                        <FormItem className="flex justify-between items-center rounded-lg border p-4">
                          <div>
                            <FormLabel className="text-base">Test Mode</FormLabel>
                            <FormDescription>
                              Use test mode for development and testing without consuming API credits.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter className="border-t p-4">
                    <Button
                      type="submit"
                      disabled={!apiKeyForm.formState.isDirty || apiKeyForm.formState.isSubmitting || saveApiKeyMutation.isPending}
                    >
                      {saveApiKeyMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save API Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;