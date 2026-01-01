import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Upload, Film, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-8 h-8 text-primary" />
            <span className="font-display text-2xl lg:text-3xl tracking-wider text-foreground">
              STREAMFLIX
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
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
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

            {/* Auth / Admin */}
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm" className="hidden sm:flex gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="hidden lg:inline">Upload</span>
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
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
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className="block px-4 py-2 text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </Link>
            )}
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
