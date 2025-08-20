export type AuthResult = {
  error?: string;
  success?: boolean;
};

export const handleAuthError = (error: unknown): AuthResult => {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  console.error("Auth error:", error);
  return { error: errorMessage };
};

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  defaultErrorMessage = "An unexpected error occurred"
): Promise<AuthResult> => {
  try {
    const result = await operation();
    if (result && typeof result === 'object' && 'error' in result) {
      const { error } = result as { error?: { message?: string } };
      return error ? { error: error.message || defaultErrorMessage } : { success: true };
    }
    return { success: true };
  } catch (error) {
    return handleAuthError(error);
  }
};