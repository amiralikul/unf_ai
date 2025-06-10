import { useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleAuthCallback, isLoading } = useAuth();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    if (success === "true") {
      // OAuth was successful, check auth status and redirect
      handleAuthCallback();
    } else if (error) {
      // OAuth failed, redirect to login with error
      console.error("OAuth error:", error);
    }
  }, [success, error, handleAuthCallback]);

  if (error) {
    return (
      <Navigate to="/login" replace state={{ error: "Authentication failed. Please try again." }} />
    );
  }

  if (success === "true") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-lg text-muted-foreground">Completing sign in...</span>
        </div>
      </div>
    );
  }

  // If no success or error params, redirect to login
  return <Navigate to="/login" replace />;
}
