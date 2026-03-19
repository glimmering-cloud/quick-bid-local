import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Moon, Sun, User, Shield, Save, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { profile, updateProfile, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setPhone(profile.phone || "");
      setLocationName(profile.location_name || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName, bio, phone, location_name: locationName });
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+41 79 123 45 67" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Zurich, Switzerland" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-4 w-4 text-primary" />
            Account
          </CardTitle>
          <CardDescription>Account details and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
              {profile?.role}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Member since</span>
            <span className="text-sm">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
