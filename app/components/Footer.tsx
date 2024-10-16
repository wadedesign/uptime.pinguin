// app/components/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-800/50 border-t border-zinc-700 p-3">
      <div className="container mx-auto">
        <p className="text-zinc-400 text-sm text-center">
          &copy; {new Date().getFullYear()} Uptime.Pinging. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
