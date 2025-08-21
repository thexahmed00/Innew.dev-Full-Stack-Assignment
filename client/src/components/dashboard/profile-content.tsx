"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { FileClient, FileUploadResult } from '@/lib/file-client';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Save, User, Mail, Camera } from 'lucide-react';

// Profile form validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
    }
  });

  // Load user data and avatar
  useEffect(() => {
    if (user) {
      // Set form values
      setValue('name', user.user_metadata?.name || user.user_metadata?.full_name || '');
      setValue('email', user.email || '');
      setValue('bio', user.user_metadata?.bio || '');

      // Load current avatar
      loadCurrentAvatar();
    }
  }, [user, setValue]);

  const loadCurrentAvatar = async () => {
    try {
      setIsLoadingAvatar(true);
      const avatar = await FileClient.getCurrentAvatar();
      console.log('🖼️ Avatar data from API:', avatar);
      console.log('🔗 Setting avatar URL:', avatar?.public_url || null);
      setCurrentAvatar(avatar?.public_url || null);
    } catch (error) {
      console.error('Error loading avatar:', error);
      // Don't show error toast for avatar loading
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: {
          name: data.name,
          full_name: data.name,
          bio: data.bio,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh user data in auth context
      await refreshUser();

      toast.success('Profile updated successfully!');
      
      // Reset form dirty state
      reset(data);

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = async (result: FileUploadResult) => {
    console.log('🎯 Avatar upload result:', result);
    console.log('📸 Setting avatar URL to:', result.url);
    
    // Update local avatar state
    setCurrentAvatar(result.url);

    // Update user metadata with avatar URL
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: result.url,
        }
      });

      if (error) {
        console.error('Error updating avatar metadata:', error);
      } else {
        console.log('✅ User metadata updated successfully');
        // Refresh user data in auth context
        await refreshUser();
        // Also reload avatar from API to ensure consistency
        await loadCurrentAvatar();
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
    }
  };

  const handleAvatarDelete = async () => {
    setCurrentAvatar(null);
    
    // Update user metadata to remove avatar URL
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        }
      });

      if (error) {
        console.error('Error removing avatar metadata:', error);
      } else {
        // Refresh user data in auth context
        await refreshUser();
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600">Manage your profile information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={currentAvatar || undefined}
              onAvatarUpdate={handleAvatarUpdate}
              onAvatarDelete={handleAvatarDelete}
              userName={user.user_metadata?.name || user.user_metadata?.full_name || 'User'}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Profile Form Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal information and account details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Changing your email will require verification.
                </p>
              </div>

              {/* Bio Field */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                  className={errors.bio ? 'border-red-500' : ''}
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Brief description about yourself (optional).
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !isDirty}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium text-gray-700">Account ID</Label>
              <p className="text-gray-600 font-mono text-xs">{user.id}</p>
            </div>
            <div>
              <Label className="font-medium text-gray-700">Account Created</Label>
              <p className="text-gray-600">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <Label className="font-medium text-gray-700">Email Verified</Label>
              <p className="text-gray-600">
                {user.email_confirmed_at ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <Label className="font-medium text-gray-700">Last Sign In</Label>
              <p className="text-gray-600">
                {user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}