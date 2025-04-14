"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { capitalize } from "lodash";
import { LIMITS as plan_limits } from "@/constants/limits";

interface PlanInfo {
  payment_plan: string;
  // plan_expires_at: string;
  used_searches: number;
  used_normal_chats: number;
  used_agent_chats: number;
}



export default function SettingsPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  // Initialize router
  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.prefetch('/pro');
    }
  }, [router]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('api/user/plan');
        console.log(response.data);
        setPlanInfo(response.data.plan_info);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);



  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [isLoading, user, router]);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  if (isLoading || !planInfo) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl z-10">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const planLimits = plan_limits[planInfo?.payment_plan as keyof typeof plan_limits]
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl z-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user!.email}
                disabled
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Subscription Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Subscription</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{capitalize(planInfo.payment_plan)}</Badge>

            {planInfo?.payment_plan === 'free' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/pro')}
                className="cursor-pointer p-0 m-0 text-xs z-10 hover:bg-transparent text-zinc-500 hover:text-zinc-700"
              >
                Upgrade →
              </Button>
            )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Searches</Label>
                  <span className="text-sm text-muted-foreground">
                    {planInfo?.used_searches || 0} / {planLimits.searches}
                  </span>
                </div>
                <Progress
                  value={(planInfo?.used_searches || 0) / planLimits.searches * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Normal Chats</Label>
                  <span className="text-sm text-muted-foreground">
                    {planInfo?.used_normal_chats || 0} / {planLimits.normal_chats}
                  </span>
                </div>
                <Progress
                  value={(planInfo?.used_normal_chats || 0) / planLimits.normal_chats * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Agent Chats</Label>
                  <span className="text-sm text-muted-foreground">
                    {planInfo?.used_agent_chats || 0} / {planLimits.agent_chats}
                  </span>
                </div>
                <Progress
                  value={(planInfo?.used_agent_chats || 0) / planLimits.agent_chats * 100}
                  className="h-2"
                />
              </div>
            </div>

          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
