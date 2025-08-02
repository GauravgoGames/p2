import { BarChart3, Trophy, Medal } from 'lucide-react';

const FeatureCards = () => {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-6 font-heading text-neutral-800">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
              <BarChart3 className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold mb-2 font-heading">Predict Matches</h3>
            <p className="text-neutral-600">Predict match and toss winners for upcoming cricket fixtures and earn points for correct predictions.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Trophy className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold mb-2 font-heading">Earn Points</h3>
            <p className="text-neutral-600">Get +1 point for each correct prediction. Top predictors are featured on the leaderboard.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
              <Medal className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold mb-2 font-heading">Climb Leaderboard</h3>
            <p className="text-neutral-600">Compete with other cricket enthusiasts and track your performance on weekly, monthly and all-time leaderboards.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;
