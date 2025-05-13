import { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  HelpCircle, 
  FileText, 
  Users, 
  Trophy, 
  Zap, 
  Mail,
  MessageCircle
} from 'lucide-react';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="w-full md:w-1/4 sticky top-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help Center
            </h2>
            
            <div className="w-full">
              <div className="flex flex-col items-start w-full bg-transparent space-y-1 h-auto">
                <button 
                  onClick={() => setActiveTab('getting-started')}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${activeTab === 'getting-started' ? 'bg-neutral-100' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Getting Started
                  </span>
                  <ChevronRight size={16} className={activeTab === 'getting-started' ? 'rotate-90' : ''} />
                </button>
                <button 
                  onClick={() => setActiveTab('making-predictions')}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${activeTab === 'making-predictions' ? 'bg-neutral-100' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Making Predictions
                  </span>
                  <ChevronRight size={16} className={activeTab === 'making-predictions' ? 'rotate-90' : ''} />
                </button>
                <button 
                  onClick={() => setActiveTab('account')}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${activeTab === 'account' ? 'bg-neutral-100' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Account Settings
                  </span>
                  <ChevronRight size={16} className={activeTab === 'account' ? 'rotate-90' : ''} />
                </button>
                <button 
                  onClick={() => setActiveTab('points-system')}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${activeTab === 'points-system' ? 'bg-neutral-100' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Points System
                  </span>
                  <ChevronRight size={16} className={activeTab === 'points-system' ? 'rotate-90' : ''} />
                </button>
                <button 
                  onClick={() => setActiveTab('faqs')}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${activeTab === 'faqs' ? 'bg-neutral-100' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    FAQs
                  </span>
                  <ChevronRight size={16} className={activeTab === 'faqs' ? 'rotate-90' : ''} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-neutral-500 mb-3">Need more help?</p>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="https://www.pro-ace-predictions.co.uk/" target="_blank" rel="noopener noreferrer">
                  <Mail size={16} />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-3/4">
          {activeTab === 'getting-started' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Getting Started Guide</CardTitle>
                <CardDescription>
                  Welcome to ProAce Predictions! Learn how to get started with predicting cricket matches.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center">1</div>
                    Create Your Account
                  </h3>
                  <div className="ml-10 space-y-2">
                    <p>To get started with ProAce Predictions, you'll need to create an account:</p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Click on the "Login" button in the top right corner of any page</li>
                      <li>Select the "Register" tab on the authentication page</li>
                      <li>Fill in your username, email, and password</li>
                      <li>Click "Register" to create your account</li>
                    </ol>
                    <div className="mt-4">
                      <Button onClick={() => window.location.href = '/auth'}>
                        Create Account Now
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center">2</div>
                    Browse Available Matches
                  </h3>
                  <div className="ml-10 space-y-2">
                    <p>After logging in, you can browse upcoming cricket matches:</p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Navigate to the "Predict Now" page from the main navigation</li>
                      <li>View all upcoming matches available for prediction</li>
                      <li>Use filters to find specific matches by team, tournament, or date</li>
                    </ol>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => window.location.href = '/predict'}>
                        Browse Matches
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center">3</div>
                    Make Your First Prediction
                  </h3>
                  <div className="ml-10 space-y-2">
                    <p>Making predictions is simple:</p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Select a match you want to predict</li>
                      <li>Choose which team you think will win the toss</li>
                      <li>Choose which team you think will win the match</li>
                      <li>Submit your prediction before the match starts</li>
                    </ol>
                    <p className="text-sm text-neutral-500 mt-2">
                      Note: Predictions can only be made for upcoming matches and cannot be changed once a match has started.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center">4</div>
                    Track Your Progress
                  </h3>
                  <div className="ml-10 space-y-2">
                    <p>After matches are completed, you can track your progress:</p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Visit your profile page to see your prediction history</li>
                      <li>Check the leaderboard to see how you rank against other users</li>
                      <li>Earn points for correct predictions and climb the rankings</li>
                    </ol>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => window.location.href = '/leaderboard'}>
                        View Leaderboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'making-predictions' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Making Predictions</CardTitle>
                <CardDescription>
                  Learn how to make accurate predictions and maximize your points.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">How to Make a Prediction</h3>
                  <div className="space-y-3">
                    <p>
                      Making a prediction is a simple process. Navigate to the "Predict Now" page where you'll see all 
                      upcoming matches. For each match, you can make two predictions:
                    </p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li><strong>Toss Winner:</strong> Which team will win the coin toss</li>
                      <li><strong>Match Winner:</strong> Which team will win the match</li>
                    </ol>
                    <p>
                      Click on a match card to expand the prediction form, make your selections, and click "Submit Prediction."
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Prediction Deadlines</h3>
                  <p>
                    All predictions must be submitted before the match starts. Once a match begins, predictions are locked 
                    and can no longer be changed. Make sure to submit your predictions early to avoid missing out on 
                    potential points.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Editing Predictions</h3>
                  <div className="space-y-3">
                    <p>
                      You can edit your predictions for a match any time before it starts:
                    </p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Find the match you previously predicted</li>
                      <li>Click on the match card to expand it</li>
                      <li>Change your predictions as desired</li>
                      <li>Click "Update Prediction" to save your changes</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Prediction Strategy Tips</h3>
                  <div className="space-y-3">
                    <p>To improve your chances of making accurate predictions:</p>
                    <ul className="list-disc ml-6 space-y-2">
                      <li>Research team performance in recent matches</li>
                      <li>Consider home advantage factors</li>
                      <li>Check player availability and key injuries</li>
                      <li>Review head-to-head records between the teams</li>
                      <li>Consider weather conditions and pitch reports</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">Pro Tip</h4>
                  <p className="text-blue-700">
                    Don't just predict based on your favorite team! Make objective predictions based on current form, 
                    player stats, and match conditions to maximize your points.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Account Settings</CardTitle>
                <CardDescription>
                  Learn how to manage your account and profile settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Updating Your Profile</h3>
                  <div className="space-y-3">
                    <p>
                      You can update your profile information at any time:
                    </p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Click on your profile picture in the navigation bar</li>
                      <li>Select "Profile" from the dropdown menu</li>
                      <li>Update your display name, email, or profile picture</li>
                      <li>Click "Save Changes" to update your profile</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Viewing Your Predictions</h3>
                  <div className="space-y-3">
                    <p>
                      To view your prediction history:
                    </p>
                    <ol className="list-decimal ml-6 space-y-2">
                      <li>Navigate to your profile page</li>
                      <li>Scroll down to see your prediction history</li>
                      <li>Use the tabs to filter between upcoming, ongoing, and completed matches</li>
                    </ol>
                    <p>
                      Your profile page shows all your predictions, including correct and incorrect ones, 
                      along with points earned.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Account Security</h3>
                  <div className="space-y-3">
                    <p>
                      To keep your account secure:
                    </p>
                    <ul className="list-disc ml-6 space-y-2">
                      <li>Use a strong, unique password</li>
                      <li>Never share your login credentials with others</li>
                      <li>Log out when using shared devices</li>
                      <li>Report any suspicious activity to our support team</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'points-system' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Points System</CardTitle>
                <CardDescription>
                  Understand how points are calculated and awarded on ProAce Predictions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">How Points Are Earned</h3>
                  <p>
                    On ProAce Predictions, you can earn points for making correct predictions. Points are awarded separately 
                    for toss winner and match winner predictions:
                  </p>
                  
                  <div className="bg-neutral-50 rounded-lg p-4 border">
                    <h4 className="font-bold mb-2">Point Distribution</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-2">Prediction Type</th>
                          <th className="text-right py-2">Points Awarded</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-neutral-200">
                          <td className="py-2">Correct Toss Winner</td>
                          <td className="text-right py-2">1 point</td>
                        </tr>
                        <tr>
                          <td className="py-2">Correct Match Winner</td>
                          <td className="text-right py-2">1 point</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p>
                    This means you can earn a maximum of 2 points per match if both your toss winner and match winner 
                    predictions are correct.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Leaderboard Rankings</h3>
                  <p>
                    The leaderboard displays users ranked by their total points. In case of a tie in points, the ranking is 
                    determined by the prediction accuracy (percentage of correct predictions).
                  </p>
                  <p>
                    Your position on the leaderboard is updated automatically after matches are completed and points are 
                    calculated.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Special Events and Tournaments</h3>
                  <p>
                    During special cricket events and tournaments, we may offer bonus points or special prediction 
                    categories. These will be announced on the platform before the event starts.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">Remember</h4>
                  <p className="text-blue-700">
                    Consistency is key! Make predictions for as many matches as possible to maximize your total points 
                    and climb the leaderboard rankings.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'faqs' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about ProAce Predictions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="q1">
                    <AccordionTrigger>Is it free to use ProAce Predictions?</AccordionTrigger>
                    <AccordionContent>
                      Yes, ProAce Predictions is completely free to use. You can create an account, make predictions, 
                      and compete on the leaderboard without any cost.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q2">
                    <AccordionTrigger>Can I change my prediction after submitting it?</AccordionTrigger>
                    <AccordionContent>
                      Yes, you can edit your predictions any time before the match starts. Once the match begins, 
                      all predictions are locked and cannot be changed.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q3">
                    <AccordionTrigger>How soon after a match ends are points awarded?</AccordionTrigger>
                    <AccordionContent>
                      Points are typically calculated and awarded within 15-30 minutes after a match ends and the 
                      results are officially confirmed. Your profile and the leaderboard will be updated automatically.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q4">
                    <AccordionTrigger>What happens if a match is abandoned or there's no result?</AccordionTrigger>
                    <AccordionContent>
                      If a match is abandoned, canceled, or ends without a result (e.g., due to rain), no points will 
                      be awarded for match winner predictions. However, if the toss took place, points for correct toss 
                      winner predictions will still be awarded.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q5">
                    <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                    <AccordionContent>
                      Yes, you can request to delete your account by contacting our support team. Please note that 
                      all your data, including prediction history and points, will be permanently removed.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q6">
                    <AccordionTrigger>How are ties in the leaderboard handled?</AccordionTrigger>
                    <AccordionContent>
                      If multiple users have the same number of points, they will be ranked based on their prediction 
                      accuracy (percentage of correct predictions). If the accuracy is also the same, they will share 
                      the same rank.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="q7">
                    <AccordionTrigger>Which cricket matches can I predict?</AccordionTrigger>
                    <AccordionContent>
                      ProAce Predictions covers major international and domestic cricket matches, including ICC tournaments, 
                      bilateral series, and premier T20 leagues like IPL, BBL, and CPL. The available matches for prediction 
                      are displayed on the Predict Now page.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;