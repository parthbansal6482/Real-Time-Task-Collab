import { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Moon, Sun, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsModal() {
  const { isSettingsOpen, toggleSettings, currentUser, updateProfile, updatePassword, logout } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ username: name.trim() });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toggleSettings();
    toast.success('Logged out successfully');
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 shadow-sm border border-gray-100">
                <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{currentUser?.name}</h3>
                <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your name"
                  className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 opacity-80">
                <Label htmlFor="email" className="text-sm font-medium text-gray-500">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email}
                  disabled
                  className="bg-gray-50 border-gray-100 text-gray-500 h-10 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400">
                  Email is used for sign in and cannot be changed.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading || name === currentUser?.name}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 shadow-sm transition-all"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Profile Changes
                </Button>

                <Separator className="my-2" />

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full h-10 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Min 8 characters"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Repeat new password"
                  className="h-10"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isLoading || !newPassword}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 shadow-sm mt-4"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>

              <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mt-4">
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  <strong>Password Requirements:</strong> Must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
