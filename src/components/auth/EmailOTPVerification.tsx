import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailOTPVerificationProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function EmailOTPVerification({ onBack, onSuccess }: EmailOTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Digite um email válido');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      toast.success('Código enviado para seu email!');
      setStep('code');
    } catch (err: any) {
      console.error('OTP error:', err);
      toast.error(err.message || 'Erro ao enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error('Verify error:', err);
      setError('Código inválido ou expirado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;
      toast.success('Novo código enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-medium text-lg mb-2">Verifique seu email</h3>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value);
              setError('');
            }}
            onComplete={handleVerifyCode}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          onClick={handleVerifyCode}
          className="w-full"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar Código'
          )}
        </Button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Reenviar código
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Usar outro email
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos métodos de login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medium text-lg mb-2">Entrar com código</h3>
        <p className="text-sm text-muted-foreground">
          Enviaremos um código de verificação para seu email
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="otp-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="pl-10 bg-secondary border-border"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Código'
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar aos métodos de login
      </Button>
    </form>
  );
}
