import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Chrome, Shield, Zap, Users, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm({ oauthError }) {
  const { login, error, loginMutation } = useAuth();
  const isLoading = loginMutation.isPending;

  const displayError = error || oauthError;

  const handleGoogleLogin = () => {
    login();
    // The login function will redirect to Google OAuth
  };

  return (
    <div className="w-full space-y-8">
      {/* Logo/Brand Section */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-primary/20">
          <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-sm"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Welcome back
          </h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950/20 dark:border-red-800/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-400">
              {displayError}
            </span>
          </div>
        </div>
      )}

      {/* Login Card */}
      <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Continue with your Google account to get started</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
            variant="outline"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Redirecting to Google...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Chrome className="w-5 h-5 text-blue-500" />
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">Secure & Fast</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">Secure</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">Fast</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30"
          >
            <CheckCircle className="w-3 h-3 mr-2" />
            Trusted by 10,000+ users
          </Badge>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
