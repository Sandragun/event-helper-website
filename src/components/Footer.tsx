import { Github, Instagram, Linkedin, Globe, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/20 mt-16 glass-card">
      <div className="container max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-lg font-semibold gradient-text">
              Bulk Certificate Generator
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Crafted with passion by
            </p>
            <a
              href="https://gomathinayagam.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold hover:text-primary transition-colors inline-flex items-center gap-2 group"
            >
              Gomathi Nayagam SR
              <Globe className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              President, DSBS Students Association
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/prince__mathi__/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2 rounded-xl hover:bg-gradient-to-br from-purple-500 to-pink-500 transition-all duration-300"
              title="Instagram"
            >
              <Instagram className="h-5 w-5 text-foreground group-hover:text-white transition-colors" />
            </a>

            <a
              href="https://www.linkedin.com/in/gomathi--nayagam/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2 rounded-xl hover:bg-blue-600 transition-all duration-300"
              title="LinkedIn"
            >
              <Linkedin className="h-5 w-5 text-foreground group-hover:text-white transition-colors" />
            </a>

            <a
              href="https://www.instagram.com/dsbs_students_association/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-3 py-2 rounded-xl glass hover:glass-card transition-all duration-300 flex items-center gap-2"
              title="DSBS Students Association"
            >
              <Instagram className="h-4 w-4 text-foreground" />
              <span className="text-xs font-medium">DSBS</span>
            </a>
          </div>

          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <p className="text-xs text-muted-foreground text-center">
            Making certificate distribution effortless for organizing teams
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
