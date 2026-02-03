import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Film, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, Tv } from 'lucide-react';
import { TVLayout } from '@/components/tv/TVLayout';
import { TVButton } from '@/components/tv/TVButton';
import { TVInput } from '@/components/tv/TVInput';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter 6+ caracteres'),
});

const AuthMobile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname === '/auth/admin';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { user, signIn, signUp, isLoading } = useAuth();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && !isLoading) {
      if (isAdminRoute) {
        navigate('/admin');
      } else {
        const from = location.state?.from || '/profiles';
        navigate(from);
      }
    }
  }, [user, isLoading, navigate, isAdminRoute, location.state]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
        }
      } else {
        const { data, error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
        } else if (data.user) {
          toast.success('Conta criada com sucesso!');
        }
      }
    } catch (err) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <TVLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout onBack={handleBack}>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 lg:p-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Film className="w-16 h-16 lg:w-20 lg:h-20 text-primary" />
            <h1 className="font-display text-4xl lg:text-6xl tracking-wider text-foreground">
              REZEFLIX
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Tv className="w-5 h-5" />
            <span className="text-lg">Mobile & TV Edition</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-lg bg-card/60 backdrop-blur-md rounded-3xl border border-border p-8 lg:p-12">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl lg:text-3xl tracking-wide text-foreground mb-2">
              {isLogin ? 'BEM-VINDO' : 'CRIAR CONTA'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isLogin ? 'Entre com seu email' : 'Crie sua conta para assistir'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <TVInput
              ref={emailInputRef}
              type="email"
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={errors.email}
              disabled={isSubmitting}
              autoComplete="email"
            />

            {/* Password Input */}
            <div className="relative">
              <TVInput
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={errors.password}
                disabled={isSubmitting}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[52px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <TVButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {isLogin ? 'Entrando...' : 'Criando...'}
                  </>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </TVButton>
            </div>

            {/* Toggle */}
            <div className="pt-4">
              <TVButton
                type="button"
                variant="outline"
                size="default"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Não tenho conta - Criar' : 'Já tenho conta - Entrar'}
              </TVButton>
            </div>

            {/* Back Button */}
            <div className="pt-2">
              <TVButton
                type="button"
                variant="ghost"
                size="default"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar ao Início
              </TVButton>
            </div>
          </form>
        </div>

        {/* Navigation Hint */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm">
            Use as <span className="text-primary font-medium">setas</span> para navegar e{' '}
            <span className="text-primary font-medium">OK/Enter</span> para selecionar
          </p>
        </div>

        {/* Admin Notice */}
        {isAdminRoute && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground bg-primary/10 px-4 py-2 rounded-lg">
              ⚠️ Acesso para administradores
            </p>
          </div>
        )}
      </div>
    </TVLayout>
  );
};

export default AuthMobile;
