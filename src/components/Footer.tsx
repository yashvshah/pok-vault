import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-primary/20 py-8 mt-20">
      <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <a
              href="https://github.com/yashnaman/early-exit-vaults/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Docs
            </a>
            <a
              href="https://x.com/roamingRahi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Twitter
            </a>
            <a
              href="https://t.me/roamingRahi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Telegram
            </a>
          </div>
        </div>
    </footer>
  );
};

export default Footer;