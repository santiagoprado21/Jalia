import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn(email.trim(), password);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-serif text-2xl font-bold">
            J
          </div>
          <CardTitle className="font-serif text-2xl">JALIA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para sincronizar tus datos entre celular y computador
          </p>
        </CardHeader>
        <CardContent>
          {!configured && (
            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              Supabase no está configurado en este entorno. La app funciona solo en este dispositivo.
            </p>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading || !configured}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Entrar
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Usen la misma cuenta en celular y computador para ver los mismos datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
