"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckSquare, 
  Clock, 
  CalendarDays 
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import CalendarEventModal from '@/components/CalendarEventModal';

type CalendarEvent = {
  id: string;
  event_type: string;
  description: string;
  notes?: string;
  event_date: string;
  event_time: string | null;
  status?: string;
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const pathname = usePathname();
  const supabase = createClient();

  // Highlight 'Calendar' if we're on the calendar page
  const isCalendarActive = pathname === '/calendar';

  const fetchTodaysEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTodaysEvents([]);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('event_date', todayStr)
        .eq('user_id', user.id);
      
      if (!error && data) {
        setTodaysEvents(data);
      }
    } catch (err) {
      console.error('Error fetching today\'s events:', err);
    }
  };

  useEffect(() => {
    fetchTodaysEvents();

    // Listen for auth changes to re-fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTodaysEvents();
    });

    const handleUpdate = () => fetchTodaysEvents();
    window.addEventListener('calendar-updated', handleUpdate);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('calendar-updated', handleUpdate);
    };
  }, []);

  const appointments = todaysEvents.filter(e => e.event_type === 'Appointment');
  const tasks = todaysEvents.filter(e => e.event_type === 'Task');
  const eventsList = todaysEvents.filter(e => e.event_type === 'Event');

  return (
    <>
      <div 
        className={`flex flex-col bg-slate-50 border-r border-slate-200 transition-all duration-300 relative ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-100 z-10"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Main button to Calendar */}
          <Link 
            href="/calendar"
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCalendarActive 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Calendar</span>}
          </Link>

          {!isCollapsed && (
            <div className="mt-8 space-y-6">
              {/* Add New Button */}
              <Button 
                onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
                className="w-full flex items-center gap-2 justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus size={16} />
                Add New Event
              </Button>

              {/* Today's Appointments */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock size={14} />
                  Today's Appointments
                </h3>
                <div className="text-sm text-slate-600 pl-6 border-l-2 border-emerald-200 ml-1 space-y-2">
                  {appointments.length > 0 ? appointments.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => { setSelectedEvent(a); setIsModalOpen(true); }}
                      className={`cursor-pointer bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-xs border border-emerald-100 hover:brightness-95 ${a.status === 'Completed' ? 'line-through opacity-70' : ''}`}
                    >
                      {a.event_time && <span className="font-semibold mr-1">{a.event_time.slice(0, 5)}</span>}
                      {a.description}
                    </div>
                  )) : <p className="italic text-slate-400">No appointments today</p>}
                </div>
              </div>

              {/* Today's Tasks */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckSquare size={14} />
                  Today's Tasks
                </h3>
                <div className="text-sm text-slate-600 pl-6 border-l-2 border-blue-200 ml-1 space-y-2">
                  {tasks.length > 0 ? tasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => { setSelectedEvent(t); setIsModalOpen(true); }}
                      className={`cursor-pointer bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs border border-blue-100 hover:brightness-95 ${t.status === 'Completed' ? 'line-through opacity-70' : ''}`}
                    >
                      {t.description}
                    </div>
                  )) : <p className="italic text-slate-400">No tasks today</p>}
                </div>
              </div>

              {/* Today's Events */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CalendarDays size={14} />
                  Today's Events
                </h3>
                <div className="text-sm text-slate-600 pl-6 border-l-2 border-purple-200 ml-1 space-y-2">
                  {eventsList.length > 0 ? eventsList.map(e => (
                    <div 
                      key={e.id} 
                      onClick={() => { setSelectedEvent(e); setIsModalOpen(true); }}
                      className={`cursor-pointer bg-purple-50 text-purple-800 px-2 py-1 rounded text-xs border border-purple-100 hover:brightness-95 ${e.status === 'Completed' ? 'line-through opacity-70' : ''}`}
                    >
                      {e.event_time && <span className="font-semibold mr-1">{e.event_time.slice(0, 5)}</span>}
                      {e.description}
                    </div>
                  )) : <p className="italic text-slate-400">No events today</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CalendarEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => {
          setIsModalOpen(false);
          fetchTodaysEvents();
        }}
        initialDate={new Date()}
        eventToEdit={selectedEvent}
      />
    </>
  );
}
