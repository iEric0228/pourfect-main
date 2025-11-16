'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Bell, 
  Monitor, 
  User, 
  Lock,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageCircle,
  Heart,
  Calendar,
  Wifi,
  Smartphone,
  Download,
  AlertTriangle,
  Trash2,
  LogOut,
  Loader2
} from 'lucide-react';
import { UserSettings, UserService, defaultUserSettings } from '@/lib/userService';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('privacy');
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSettings = await UserService.getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      await UserService.updateUserSettings(user.uid, newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = (category: keyof UserSettings, key: string) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !(settings[category] as any)[key]
      }
    };
    setSettings(newSettings);
    updateSettings({ [category]: newSettings[category] });
  };

  const handleSelectSetting = (category: keyof UserSettings, key: string, value: string) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
    updateSettings({ [category]: newSettings[category] });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      await UserService.deleteUserAccount(user.uid);
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'content', name: 'Content', icon: Monitor },
    { id: 'account', name: 'Account', icon: Lock },
  ];

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    disabled = false 
  }: { 
    enabled: boolean; 
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled || saving}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        enabled ? 'bg-purple-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    description, 
    control 
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    control: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-400" />
        <div>
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      {control}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Privacy Settings</h3>
                    <div className="space-y-1">
                      <SettingRow
                        icon={Eye}
                        title="Profile Visibility"
                        description="Who can see your profile"
                        control={
                          <select
                            value={settings.privacy.profileVisibility}
                            onChange={(e) => handleSelectSetting('privacy', 'profileVisibility', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                          >
                            <option value="public">Everyone</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Only Me</option>
                          </select>
                        }
                      />
                      <SettingRow
                        icon={Mail}
                        title="Show Email"
                        description="Display email on your profile"
                        control={
                          <ToggleSwitch
                            enabled={settings.privacy.showEmail}
                            onChange={() => handleToggleSetting('privacy', 'showEmail')}
                          />
                        }
                      />
                      <SettingRow
                        icon={MapPin}
                        title="Show Location"
                        description="Display location information"
                        control={
                          <ToggleSwitch
                            enabled={settings.privacy.showLocation}
                            onChange={() => handleToggleSetting('privacy', 'showLocation')}
                          />
                        }
                      />
                      <SettingRow
                        icon={MessageCircle}
                        title="Messages from Strangers"
                        description="Allow messages from people you don't follow"
                        control={
                          <ToggleSwitch
                            enabled={settings.privacy.allowMessageFromStrangers}
                            onChange={() => handleToggleSetting('privacy', 'allowMessageFromStrangers')}
                          />
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Notification Settings</h3>
                    <div className="space-y-1">
                      <SettingRow
                        icon={Bell}
                        title="Push Notifications"
                        description="Receive notifications on your device"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.pushNotifications}
                            onChange={() => handleToggleSetting('notifications', 'pushNotifications')}
                          />
                        }
                      />
                      <SettingRow
                        icon={Mail}
                        title="Email Notifications"
                        description="Receive notifications via email"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.emailNotifications}
                            onChange={() => handleToggleSetting('notifications', 'emailNotifications')}
                          />
                        }
                      />
                      <SettingRow
                        icon={User}
                        title="Follow Notifications"
                        description="When someone follows you"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.followNotifications}
                            onChange={() => handleToggleSetting('notifications', 'followNotifications')}
                          />
                        }
                      />
                      <SettingRow
                        icon={Heart}
                        title="Like Notifications"
                        description="When someone likes your posts"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.likeNotifications}
                            onChange={() => handleToggleSetting('notifications', 'likeNotifications')}
                          />
                        }
                      />
                      <SettingRow
                        icon={MessageCircle}
                        title="Comment Notifications"
                        description="When someone comments on your posts"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.commentNotifications}
                            onChange={() => handleToggleSetting('notifications', 'commentNotifications')}
                          />
                        }
                      />
                      <SettingRow
                        icon={Calendar}
                        title="Event Invitations"
                        description="When you're invited to events"
                        control={
                          <ToggleSwitch
                            enabled={settings.notifications.eventInvitations}
                            onChange={() => handleToggleSetting('notifications', 'eventInvitations')}
                          />
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Content Settings */}
                {activeTab === 'content' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Content & Display</h3>
                    <div className="space-y-1">
                      <SettingRow
                        icon={Monitor}
                        title="Autoplay Videos"
                        description="Automatically play videos in feed"
                        control={
                          <ToggleSwitch
                            enabled={settings.content.autoplayVideos}
                            onChange={() => handleToggleSetting('content', 'autoplayVideos')}
                          />
                        }
                      />
                      <SettingRow
                        icon={EyeOff}
                        title="Show Sensitive Content"
                        description="Display potentially sensitive content"
                        control={
                          <ToggleSwitch
                            enabled={settings.content.showSensitiveContent}
                            onChange={() => handleToggleSetting('content', 'showSensitiveContent')}
                          />
                        }
                      />
                      <SettingRow
                        icon={Wifi}
                        title="Data Usage"
                        description="When to load high-quality content"
                        control={
                          <select
                            value={settings.content.dataUsage}
                            onChange={(e) => handleSelectSetting('content', 'dataUsage', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                          >
                            <option value="wifi">Wi-Fi Only</option>
                            <option value="cellular">Cellular Only</option>
                            <option value="both">Wi-Fi & Cellular</option>
                          </select>
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Account & Security</h3>
                    <div className="space-y-1">
                      <SettingRow
                        icon={Shield}
                        title="Two-Factor Authentication"
                        description="Add an extra layer of security"
                        control={
                          <ToggleSwitch
                            enabled={settings.account.twoFactorAuth}
                            onChange={() => handleToggleSetting('account', 'twoFactorAuth')}
                          />
                        }
                      />
                      <SettingRow
                        icon={AlertTriangle}
                        title="Login Alerts"
                        description="Get notified of new logins"
                        control={
                          <ToggleSwitch
                            enabled={settings.account.loginAlerts}
                            onChange={() => handleToggleSetting('account', 'loginAlerts')}
                          />
                        }
                      />
                      <SettingRow
                        icon={Download}
                        title="Download Your Data"
                        description="Request a copy of your account data"
                        control={
                          <button className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm hover:bg-purple-600/30 transition-colors">
                            Request
                          </button>
                        }
                      />
                      
                      {/* Danger Zone */}
                      <div className="pt-6 mt-6 border-t border-red-500/20">
                        <h4 className="text-red-400 font-medium mb-4">Danger Zone</h4>
                        <div className="space-y-3">
                          <SettingRow
                            icon={LogOut}
                            title="Sign Out"
                            description="Sign out of your account"
                            control={
                              <button
                                onClick={signOut}
                                className="px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg text-sm hover:bg-gray-600/30 transition-colors"
                              >
                                Sign Out
                              </button>
                            }
                          />
                          <SettingRow
                            icon={Trash2}
                            title="Delete Account"
                            description="Permanently delete your account and all data"
                            control={
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-red-500/30 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h3 className="text-xl font-bold text-white">Delete Account</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
