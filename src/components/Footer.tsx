const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-primary/20 py-6 sm:py-8 mt-12 sm:mt-16 md:mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6">
            <a
              href="https://github.com/yashnaman/early-exit-vaults/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Docs
            </a>
            <a
              href="https://x.com/POKVault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Twitter
            </a>
            <a
              href="https://discord.gg/5C4kjvJHgD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Discord
            </a>
          </div>
        </div>
    </footer>
  );
};

export default Footer;