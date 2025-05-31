import { useLocation, Link } from 'wouter';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

const Navbar = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  // Fetch site logo
  const { data: logoData } = useQuery({
    queryKey: ['/api/settings/siteLogo'],
    queryFn: async () => {
      const response = await fetch('/api/settings/siteLogo');
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch site logo');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Update site logo when data changes
  useEffect(() => {
    if (logoData && logoData.value) {
      setSiteLogo(logoData.value);
    }
  }, [logoData]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div 
                onClick={() => window.location.href = '/'}
                className="text-2xl font-bold font-heading text-primary flex items-center cursor-pointer"
              >
                {siteLogo ? (
                  <img 
                    src={siteLogo} 
                    alt="ProAce Predictions Logo" 
                    className="h-12 w-auto mr-2 object-contain"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent mr-2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M6 12h12" />
                    <path d="M12 6v12" />
                  </svg>
                )}
                ProAce Predictions
              </div>
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <div 
              onClick={() => window.location.href = 'https://www.pro-ace-predictions.co.uk/'}
              className="px-3 py-2 text-sm font-medium cursor-pointer text-neutral-800 hover:text-primary"
            >
              MainSite
            </div>
            <div 
              onClick={() => window.location.href = '/'}
              className={`px-3 py-2 text-sm font-medium cursor-pointer ${location === '/' ? 'text-primary' : 'text-neutral-800 hover:text-primary'}`}
            >
              Home
            </div>
            <div 
              onClick={() => window.location.href = '/predict'}
              className={`px-3 py-2 text-sm font-medium cursor-pointer ${location === '/predict' ? 'text-primary' : 'text-neutral-800 hover:text-primary'}`}
            >
              Predict Now
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={`px-3 py-2 text-sm font-medium cursor-pointer flex items-center gap-1 ${location.startsWith('/tournaments') ? 'text-primary' : 'text-neutral-800 hover:text-primary'}`}>
                  Tournaments
                  <ChevronDown className="h-3 w-3" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => window.location.href = '/tournaments'}>
                  All Tournaments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/tournaments/1/analysis'}>
                  Tournament Analysis
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div 
              onClick={() => window.location.href = '/leaderboard'}
              className={`px-3 py-2 text-sm font-medium cursor-pointer ${location === '/leaderboard' ? 'text-primary' : 'text-neutral-800 hover:text-primary'}`}
            >
              Leaderboard
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {!user ? (
                  <Button 
                    className="px-4 py-2 text-sm font-medium text-white"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Login
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="ml-3 relative flex items-center">
                        <Avatar className="h-8 w-8 border-2 border-neutral-100">
                          <AvatarImage src={user.profileImage || ''} alt={user.username} />
                          <AvatarFallback className="bg-primary text-white">
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="ml-2 font-medium text-neutral-800">{user.displayName || user.username}</span>
                        <ChevronDown className="ml-1 h-4 w-4 text-neutral-500" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                        Your Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/profile/update'}>
                        Update Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/help'}>
                        Help
                      </DropdownMenuItem>
                      {user.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                            Admin Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/matches'}>
                            Manage Matches
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/teams'}>
                            Manage Teams
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/tournaments'}>
                            Manage Tournaments
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/users'}>
                            Manage Users
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/settings'}>
                            Site Settings
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                type="button"
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-neutral-800 hover:text-primary hover:bg-neutral-100 focus:outline-none"
                aria-expanded="false"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location === '/' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/';
                setIsMobileMenuOpen(false);
              }}
            >
              Home
            </div>
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location === '/predict' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/predict';
                setIsMobileMenuOpen(false);
              }}
            >
              Predict Now
            </div>
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location.startsWith('/tournaments') ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/tournaments';
                setIsMobileMenuOpen(false);
              }}
            >
              Tournaments
            </div>
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location.includes('/analysis') ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/tournaments/1/analysis';
                setIsMobileMenuOpen(false);
              }}
            >
              Tournament Analysis
            </div>
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location === '/leaderboard' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/leaderboard';
                setIsMobileMenuOpen(false);
              }}
            >
              Leaderboard
            </div>
            <div
              className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                location === '/help' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              onClick={() => {
                window.location.href = '/help';
                setIsMobileMenuOpen(false);
              }}
            >
              Help
            </div>
            {user && (
              <>
                <div
                  className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                    location === '/profile' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
                  }`}
                  onClick={() => {
                    window.location.href = '/profile';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  My Profile
                </div>
                <div
                  className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                    location === '/profile/update' ? 'text-primary' : 'text-neutral-800 hover:bg-neutral-100'
                  }`}
                  onClick={() => {
                    window.location.href = '/profile/update';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Update Profile
                </div>
              </>
            )}
          </div>
          {user ? (
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-neutral-100">
                    <AvatarImage src={user.profileImage || ''} alt={user.username} />
                    <AvatarFallback className="bg-primary text-white">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">{user.displayName || user.username}</div>
                  <div className="text-sm font-medium text-neutral-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div 
                  className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                  onClick={() => {
                    window.location.href = '/profile';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Your Profile
                </div>
                {user.role === 'admin' && (
                  <>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Admin Dashboard
                    </div>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin/matches';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Manage Matches
                    </div>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin/users';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Manage Users
                    </div>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin/teams';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Manage Teams
                    </div>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin/tournaments';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Manage Tournaments
                    </div>
                    <div 
                      className="block px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 cursor-pointer" 
                      onClick={() => {
                        window.location.href = '/admin/settings';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Site Settings
                    </div>
                  </>
                )}
                <button
                  className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-neutral-200 px-5">
              <div
                className="block text-center w-full px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-dark cursor-pointer"
                onClick={() => {
                  window.location.href = '/auth';
                  setIsMobileMenuOpen(false);
                }}
              >
                Login / Register
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;