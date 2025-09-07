'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { 
  Bell, 
  Globe, 
  Shield, 
  Download, 
  Trash2, 
  Moon, 
  Sun, 
  Monitor,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  Pill,
  Heart,
  FileText
} from 'lucide-react';

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newsletterSubscribed: boolean;
  appointmentReminders: boolean;
  medicationReminders: boolean;
  vitalReminders: boolean;
  labResultAlerts: boolean;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  unitSystem: string;
  temperatureUnit: string;
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  dataRetentionDays: number;
  exportFormat: string;
  lastExportDate?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Settings updated');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/settings/export?format=${settings?.exportFormat || 'json'}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${Date.now()}.${settings?.exportFormat === 'csv' ? 'csv' : 'json'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
        fetchSettings();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        await signOut({ callbackUrl: '/' });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) return null;

  const themeIcon = settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : 
                    settings.theme === 'light' ? <Sun className="h-4 w-4" /> : 
                    <Monitor className="h-4 w-4" />;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display">
            <Globe className="h-4 w-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="data">
            <Download className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive text message notifications</p>
                  </div>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSettings({ smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming appointments</p>
                  </div>
                </div>
                <Switch
                  id="appointment-reminders"
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => updateSettings({ appointmentReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="medication-reminders">Medication Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to take your medications</p>
                  </div>
                </div>
                <Switch
                  id="medication-reminders"
                  checked={settings.medicationReminders}
                  onCheckedChange={(checked) => updateSettings({ medicationReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="vital-reminders">Vital Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to record your vitals</p>
                  </div>
                </div>
                <Switch
                  id="vital-reminders"
                  checked={settings.vitalReminders}
                  onCheckedChange={(checked) => updateSettings({ vitalReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="lab-alerts">Lab Result Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when lab results are available</p>
                  </div>
                </div>
                <Switch
                  id="lab-alerts"
                  checked={settings.labResultAlerts}
                  onCheckedChange={(checked) => updateSettings({ labResultAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSettings({ theme: value })}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSettings({ language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => updateSettings({ dateFormat: value })}
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={settings.timeFormat}
                    onValueChange={(value) => updateSettings({ timeFormat: value })}
                  >
                    <SelectTrigger id="time-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
              <CardDescription>Choose your preferred measurement units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unit-system">Unit System</Label>
                <Select
                  value={settings.unitSystem}
                  onValueChange={(value) => updateSettings({ unitSystem: value })}
                >
                  <SelectTrigger id="unit-system">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature-unit">Temperature Unit</Label>
                <Select
                  value={settings.temperatureUnit}
                  onValueChange={(value) => updateSettings({ temperatureUnit: value })}
                >
                  <SelectTrigger id="temperature-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Privacy</CardTitle>
              <CardDescription>Control who can see your information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={settings.profileVisibility}
                  onValueChange={(value) => updateSettings({ profileVisibility: value })}
                >
                  <SelectTrigger id="profile-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-email">Show Email Address</Label>
                <Switch
                  id="show-email"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => updateSettings({ showEmail: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-phone">Show Phone Number</Label>
                <Switch
                  id="show-phone"
                  checked={settings.showPhone}
                  onCheckedChange={(checked) => updateSettings({ showPhone: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-location">Show Location</Label>
                <Switch
                  id="show-location"
                  checked={settings.showLocation}
                  onCheckedChange={(checked) => updateSettings({ showLocation: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download a copy of your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value) => updateSettings({ exportFormat: value })}
                >
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.lastExportDate && (
                <p className="text-sm text-muted-foreground">
                  Last exported: {new Date(settings.lastExportDate).toLocaleDateString()}
                </p>
              )}

              <Button onClick={handleExportData} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all of your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Enter your password to confirm</Label>
                      <Input
                        id="password"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeletePassword('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={!deletePassword}
                    >
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}