import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';

// Simplified footer as per issue #6
const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold font-heading">ProAce Predictions</h3>
            <p className="text-neutral-300 text-sm">Cricket match predictions platform</p>
          </div>

          <div className="flex space-x-8 mb-4 md:mb-0">
            <Link href="/" className="text-neutral-300 hover:text-white text-sm">
              Home
            </Link>
            <Link href="/#leaderboard" className="text-neutral-300 hover:text-white text-sm">
              Leaderboard
            </Link>
            <Link href="/profile" className="text-neutral-300 hover:text-white text-sm">
              My Profile
            </Link>
            <Link href="/help" className="text-neutral-300 hover:text-white text-sm">
              Help
            </Link>
            <a href="https://www.pro-ace-predictions.co.uk/contact/" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white text-sm">
              Contact Us
            </a>
            <a href="https://www.pro-ace-predictions.co.uk/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white text-sm">
              Privacy Policy
            </a>
          </div>

          <div className="flex space-x-4">
            <a href="https://www.instagram.com/proacepredictions/" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-4 pt-4">
          <p className="text-neutral-400 text-center text-sm">© {new Date().getFullYear()} ProAce Predictions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;