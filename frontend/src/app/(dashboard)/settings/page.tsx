"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Check } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

export default function SettingsPage() {
  const { user, fetchMe } = useAuthStore();
  const [profileSaved, setProfileSaved] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const profileForm = useForm({
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", currentPassword: "", newPassword: "" },
  });

  const keysForm = useForm({
    defaultValues: { apiKeyAnthropic: "", apiKeyOpenAI: "" },
  });

  const saveProfile = async (data: { name: string; email: string; currentPassword: string; newPassword: string }) => {
    setIsSavingProfile(true);
    try {
      await api.put("/api/settings/profile", {
        name: data.name,
        email: data.email,
        ...(data.newPassword ? { currentPassword: data.currentPassword, newPassword: data.newPassword } : {}),
      });
      await fetchMe();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveKeys = async (data: { apiKeyAnthropic: string; apiKeyOpenAI: string }) => {
    setIsSavingKeys(true);
    try {
      await api.put("/api/settings/api-keys", {
        apiKeyAnthropic: data.apiKeyAnthropic || null,
        apiKeyOpenAI: data.apiKeyOpenAI || null,
      });
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKeys(false);
    }
  };

  return (
    <div>
      <Topbar title="Configurações" description="Gerencie sua conta e integrações" />

      <div className="p-6 max-w-2xl space-y-4">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados da conta</CardTitle>
                <CardDescription>Atualize seu nome, email e senha</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input {...profileForm.register("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" {...profileForm.register("email")} />
                  </div>
                  <div className="border-t border-border pt-4 space-y-4">
                    <p className="text-sm font-medium">Alterar senha</p>
                    <div className="space-y-1.5">
                      <Label>Senha atual</Label>
                      <Input type="password" placeholder="••••••••" {...profileForm.register("currentPassword")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nova senha</Label>
                      <Input type="password" placeholder="Mín. 8 caracteres" {...profileForm.register("newPassword")} />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <Check className="w-4 h-4" /> : null}
                    {profileSaved ? "Salvo!" : "Salvar alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Configure suas chaves para usar Claude e GPT. Elas ficam criptografadas no servidor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={keysForm.handleSubmit(saveKeys)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Anthropic API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-ant-..."
                      {...keysForm.register("apiKeyAnthropic")}
                    />
                    <p className="text-xs text-text-muted">Necessária para usar Claude Sonnet / Haiku</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>OpenAI API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      {...keysForm.register("apiKeyOpenAI")}
                    />
                    <p className="text-xs text-text-muted">Necessária para usar GPT-4o / GPT-4o mini</p>
                  </div>
                  <Button type="submit" disabled={isSavingKeys}>
                    {isSavingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : keysSaved ? <Check className="w-4 h-4" /> : null}
                    {keysSaved ? "Salvo!" : "Salvar chaves"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
