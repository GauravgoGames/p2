import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="mb-10 relative overflow-hidden rounded-xl">
      <div 
        className="h-80 bg-cover bg-center rounded-xl relative" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')" 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 rounded-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">Cricket Match Predictions</h1>
            <p className="text-xl text-white mb-6 max-w-2xl">Predict match winners, win points, climb the leaderboard</p>
            
            {user ? (
              <Link href="/predict">
                <Button className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md shadow-lg transition-all duration-300 transform hover:scale-105">
                  Start Predicting
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md shadow-lg transition-all duration-300 transform hover:scale-105">
                  Sign Up & Predict
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
