import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Upload, Film, LogIn, LogOut, User, Radio, History, Heart, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeSelectorCompact } from '@/components/ThemeSelectorCompact';
import { ProfileSettings } from '@/components/ProfileSettings';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { useProfileContext } from '@/contexts/ProfileContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { selectedProfile, clearProfile } = useProfileContext();
  const { isInstallable, isIOS, isStandalone } = usePWAInstall();
  const showInstallOption = (isInstallable || isIOS) && !isStandalone;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    clearProfile();
    await signOut();
    navigate('/');
  };

  const handleNavigateToAdmin = () => {
    navigate('/admin');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-8 h-8 text-primary" />
            <span className="font-display text-2xl lg:text-3xl tracking-wider text-foreground">
              REZEFLIX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <Link 
              to="/catalog" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Catálogo
            </Link>
            <Link 
              to="/catalog?type=movie" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Filmes
            </Link>
            <Link 
              to="/catalog?type=series" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Séries
            </Link>
            <Link 
              to="/tv" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Radio className="w-3 h-3" />
              TV ao Vivo
            </Link>
            <Link 
              to="/party" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Watch Party
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 lg:w-64 bg-secondary border-border"
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Theme Toggle (dark/light) */}
            <ThemeToggle />

            {/* Color Theme Selector (only for logged in users) */}
            {user && <ThemeSelectorCompact />}

            {/* Profile Switcher (show selected profile with quick switch) */}
            {user && selectedProfile && <ProfileSwitcher compact />}

            {/* Auth / User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="w-9 h-9">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <ProfileSettings>
                      <div className="flex items-center w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Meu Perfil
                      </div>
                    </ProfileSettings>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/history')} className="cursor-pointer">
                    <History className="w-4 h-4 mr-2" />
                    Histórico
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/history')} className="cursor-pointer">
                    <Heart className="w-4 h-4 mr-2" />
                    Favoritos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/party')} className="cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    Watch Party
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={handleNavigateToAdmin} className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Painel Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="secondary" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 bg-background/95 backdrop-blur-lg rounded-lg">
            <Link 
              to="/" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              to="/catalog" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Catálogo
            </Link>
            <Link 
              to="/catalog?type=movie" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Filmes
            </Link>
            <Link 
              to="/catalog?type=series" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Séries
            </Link>
            <Link 
              to="/tv" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Radio className="w-4 h-4 inline mr-2" />
              TV ao Vivo
            </Link>
            <Link 
              to="/party" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Watch Party
            </Link>
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className="block px-4 py-2 text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Painel Admin
              </Link>
            )}
            {showInstallOption && (
              <Link 
                to="/install" 
                className="block px-4 py-2 text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Instalar App
              </Link>
            )}
            <Link 
              to="/download" 
              className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Baixar APK Android
            </Link>
            {!user && (
              <Link 
                to="/auth" 
                className="block px-4 py-2 text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
