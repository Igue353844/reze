import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <span className="font-display text-xl tracking-wider text-foreground">
              REZEFLIX
            </span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Início
            </Link>
            <Link to="/catalog" className="hover:text-foreground transition-colors">
              Catálogo
            </Link>
            <Link to="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2024 RezeFlix. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
