import { Calendar, MapPin, Users, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UpcomingEvents = () => {
  return (
    <div id="upcoming-events" className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-heading text-neutral-800">Upcoming Events</h2>
        <a href="#" className="text-primary font-medium text-sm flex items-center">
          View All
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 ml-1"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/3 mb-4 lg:mb-0">
              <img 
                src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=350" 
                alt="T20 World Cup Trophy" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <div className="lg:w-2/3 lg:pl-6">
              <h3 className="text-xl font-bold mb-2 font-heading">T20 World Cup 2023</h3>
              <p className="text-neutral-600 mb-4">
                The biggest T20 cricket tournament returns with 16 teams competing for the championship. 
                Join thousands of fans in predicting match outcomes and climb the leaderboard!
              </p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center text-sm text-neutral-500">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Oct 18 - Nov 15, 2023</span>
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Australia</span>
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <Users className="mr-2 h-4 w-4" />
                  <span>16 Teams</span>
                </div>
              </div>
              
              <div>
                <Button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md mr-3">
                  <Bell className="mr-1 h-4 w-4" /> Set Reminder
                </Button>
                <Button variant="outline" className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-md">
                  View Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;
