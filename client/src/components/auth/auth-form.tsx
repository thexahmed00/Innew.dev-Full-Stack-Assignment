"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignInForm } from "./signin-form"
import { SignUpForm } from "./signup-form"

export function AuthForm() {
  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin" className="mt-6">
        <SignInForm />
      </TabsContent>
      <TabsContent value="signup" className="mt-6">
        <SignUpForm />
      </TabsContent>
    </Tabs>
  )
}
