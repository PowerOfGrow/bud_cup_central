import { Button } from "@/components/ui/button";
import { Award, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-premium p-2 rounded-lg shadow-elegant group-hover:shadow-gold transition-all duration-300">
              <Award className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CBD Flower Cup</h1>
              <p className="text-xs text-muted-foreground">Premium Competition Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-accent transition-colors font-medium">
              Home
            </Link>
            <Link to="/contests" className="text-foreground hover:text-accent transition-colors font-medium">
              Contests
            </Link>
            <Link to="/about" className="text-foreground hover:text-accent transition-colors font-medium">
              About
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              Sign In
            </Button>
            <Button className="bg-gradient-gold shadow-gold hover:shadow-elegant transition-all duration-300">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/contests" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contests
              </Link>
              <Link 
                to="/about" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="w-full border-accent text-accent">
                  Sign In
                </Button>
                <Button className="w-full bg-gradient-gold">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;