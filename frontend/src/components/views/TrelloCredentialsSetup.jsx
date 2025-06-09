import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Key, CheckCircle, AlertCircle } from "lucide-react";
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function TrelloCredentialsSetup({ onSuccess }) {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const updateCredentialsMutation = useMutation({
    mutationFn: (credentials) => api.updateTrelloCredentials(credentials),
    onSuccess: (data) => {
      // Invalidate auth status to refresh user data
      queryClient.invalidateQueries(['auth', 'status']);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      setError(error.message || 'Failed to save Trello credentials');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim() || !token.trim()) {
      setError('Both API key and token are required');
      return;
    }

    updateCredentialsMutation.mutate({
      trelloApiKey: apiKey.trim(),
      trelloToken: token.trim()
    });
  };

  const isLoading = updateCredentialsMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Trello API Setup
          </CardTitle>
          <CardDescription>
            Configure your Trello API credentials to sync boards and cards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll need to get your API key and token from Trello. Follow the steps below to obtain them.
            </AlertDescription>
          </Alert>

          {/* Step-by-step instructions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Get your API Key</h4>
              <p className="text-sm text-muted-foreground">
                Visit the Trello Developer API Keys page to get your API key.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://trello.com/app-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Get API Key <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Generate a Token</h4>
              <p className="text-sm text-muted-foreground">
                After getting your API key, you'll need to generate a token. Replace YOUR_API_KEY in the URL below with your actual API key.
              </p>
              <div className="bg-muted p-3 rounded-md text-sm font-mono break-all">
                https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&name=UnframeAI&key=YOUR_API_KEY
              </div>
              <p className="text-xs text-muted-foreground">
                This will give you read access to your Trello boards and cards.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Enter your Trello API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your Trello token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving credentials...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Save Trello Credentials
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 