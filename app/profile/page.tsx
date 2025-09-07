'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  Activity,
  AlertCircle,
  Edit,
  Upload,
  Briefcase,
  Globe,
  Users
} from 'lucide-react';
import { calculateBMI, calculateAge, formatDate, getInitials } from '@/lib/utils/calculations';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
  occupation?: string;
  company?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  height?: number;
  weight?: number;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  profilePicture?: string;
  coverImage?: string;
  user: {
    email: string;
    name?: string;
    image?: string;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, ...data.profile } : null);
        toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} image updated`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = calculateAge(profile.dateOfBirth);
  const bmi = calculateBMI(profile.weight, profile.height);
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.user.name || 'User';
  const initials = getInitials(profile.firstName, profile.lastName);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="relative">
        <div 
          className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative"
          style={{
            backgroundImage: profile.coverImage ? `url(${profile.coverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <label className="absolute bottom-4 right-4">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'cover');
              }}
              disabled={uploading}
            />
            <Button
              size="sm"
              variant="secondary"
              className="cursor-pointer"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
          </label>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 px-6 -mt-16">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile.profilePicture || profile.user.image || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'profile');
                }}
                disabled={uploading}
              />
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-8 w-8 cursor-pointer"
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold">{fullName}</h1>
            <p className="text-muted-foreground">{profile.user.email}</p>
            {profile.bio && (
              <p className="mt-2 text-sm">{profile.bio}</p>
            )}
          </div>

          <Link href="/profile/edit">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="personal" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not provided'}
                    {age !== null && ` (${age} years old)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{profile.gender || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[profile.city, profile.state, profile.country]
                      .filter(Boolean)
                      .join(', ') || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Physical Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="text-2xl font-bold">
                      {profile.height ? `${profile.height} cm` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="text-2xl font-bold">
                      {profile.weight ? `${profile.weight} kg` : '--'}
                    </p>
                  </div>
                </div>

                {bmi && (
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Body Mass Index (BMI)</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold">{bmi.value}</p>
                      <Badge className={bmi.color} variant="secondary">
                        {bmi.category}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Type</p>
                    <p className="font-medium">{profile.bloodType || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{profile.emergencyContact || 'Not provided'}</p>
                    {profile.emergencyPhone && (
                      <p className="text-sm text-muted-foreground">{profile.emergencyPhone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phoneNumber || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {profile.address || 'Not provided'}
                    {profile.postalCode && `, ${profile.postalCode}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{profile.occupation || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{profile.company || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {profile.website ? (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}