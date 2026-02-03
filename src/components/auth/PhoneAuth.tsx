import { useState } from 'react';
import { Phone, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhoneAuthProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function PhoneAuth({ onBack, onSuccess }: PhoneAuthProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Format phone number for display
  const formatPhoneDisplay = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Brazilian phone: (XX) XXXXX-XXXX
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      setPhone(formatPhoneDisplay(digits));
      setError('');
    }
  };

  // Get E.164 format for Supabase
  const getE164Phone = () => {
    const digits = phone.replace(/\D/g, '');
    return `+55${digits}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      setError('Digite um número de telefone válido');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: getE164Phone(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      toast.success('Código enviado por SMS!');
      setStep('code');
    } catch (err: any) {
      console.error('Phone OTP error:', err);
      if (err.message?.includes('Phone signups are disabled')) {
        toast.error('Login por telefone não está habilitado. Contate o administrador.');
      } else {
        toast.error(err.message || 'Erro ao enviar código');
      }
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
        phone: getE164Phone(),
        token: code,
        type: 'sms',
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
        phone: getE164Phone(),
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
          <h3 className="font-medium text-lg mb-2">Verifique seu telefone</h3>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para<br />
            <span className="font-medium text-foreground">{phone}</span>
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
              setStep('phone');
              setCode('');
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Usar outro número
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
        <h3 className="font-medium text-lg mb-2">Entrar com telefone</h3>
        <p className="text-sm text-muted-foreground">
          Enviaremos um código de verificação por SMS
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground border-r pr-2">
            +55
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            className="pl-20 bg-secondary border-border"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Formato: (DDD) + Número do celular
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Código SMS'
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
