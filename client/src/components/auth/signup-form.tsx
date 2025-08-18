"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, ArrowLeft, Mail, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be at least 6 characters")
    .max(6, "OTP must be at most 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export function SignUpForm() {
  const [authMethod, setAuthMethod] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{ email: string; password: string }>(
    {
      email: "",
      password: "",
    }
  );

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSignUpSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setUserData(data);

    // Simulate API call for user registration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setAuthMethod("otp");
  };

  const onOtpSubmit = async (_data: OtpFormData) => {
    setIsLoading(true);

    // Simulate OTP verification and account creation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    // Handle successful account creation
    console.log("Account created successfully");
  };

  const onGoogleSignUp = async () => {
    setIsLoading(true);

    // Simulate Google OAuth
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    // Handle Google sign up
    console.log("Google sign up successful");
  };

  const handleBackToEmail = () => {
    setAuthMethod("email");
    setUserData({ email: "", password: "" });
  };

  if (authMethod === "otp") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToEmail}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit code to {userData.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={otpForm.handleSubmit(onOtpSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                {...otpForm.register("otp")}
                className="text-center text-lg tracking-widest"
              />
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                {...signUpForm.register("email")}
              />
            </div>
            {signUpForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                {...signUpForm.register("password")}
              />
            </div>
            {signUpForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Smartphone className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGoogleSignUp}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLoading ? "Signing up..." : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}
