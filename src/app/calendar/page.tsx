"use client";

import { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  isSameDay, 
  isWeekend 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import CalendarEventModal from '@/components/CalendarEventModal';

// Static Holiday list for highlighting (simplified)
const HOLIDAYS: Record<string, string> = {
  '01-01': "New Year's Day",
  '01-15': "Martin Luther King Jr. Day",
  '02-14': "Valentine's Day",
  '02-19': "President's Day",
  '03-17': "St. Patrick's Day",
  '05-05': "Cinco de Mayo",
  '06-19': "Juneteenth",
  '07-04': "Independence Day",
  '10-31': "Halloween",
  '11-11': "Veterans Day",
  '12-25': "Christmas Day",
  '12-31': "New Year's Eve"
};

type CalendarEvent = {
  id: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  description: string;
  status: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const supabase = createClient();

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      let query = supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', format(start, 'yyyy-MM-dd'))
        .lte('event_date', format(end, 'yyyy-MM-dd'));

      // Regular users only see their own events.
      // Admins/Supervisors see everything (handled by lack of filter, RLS still applies).
      if (profile && profile.role !== 'Admin' && profile.role !== 'Supervisor') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (data && !error) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });

    const handleUpdate = () => fetchEvents();
    window.addEventListener('calendar-updated', handleUpdate);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('calendar-updated', handleUpdate);
    };
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper colors for events
  const getEventColor = (type: string) => {
    switch(type) {
      case 'Appointment': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Event': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDayEvents = (day: Date) => {
    return events.filter(e => e.event_date === format(day, 'yyyy-MM-dd'));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation(); // prevent triggering the day click
    setSelectedEvent(event);
    setSelectedDate(new Date(event.event_date));
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Button 
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Plus size={16} />
          Add Event
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekDays.map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto">
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);
            const weekend = isWeekend(day);
            const holiday = HOLIDAYS[format(day, 'MM-dd')];
            const dayEvents = getDayEvents(day);

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[120px] p-2 border-r border-b border-slate-200 transition-colors
                  ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''}
                  ${isCurrentMonth && weekend ? 'bg-slate-50/50' : ''}
                  ${isCurrentMonth && holiday ? 'bg-rose-50/30' : ''}
                  hover:bg-slate-50 flex flex-col cursor-pointer
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}
                  `}>
                    {format(day, dateFormat)}
                  </span>
                  {holiday && <span className="text-[10px] uppercase font-bold text-rose-500 truncate pl-1" title={holiday}>{holiday}</span>}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={`text-xs px-2 py-1 rounded truncate border ${getEventColor(event.event_type)} hover:brightness-95 ${event.status === 'Completed' ? 'line-through opacity-70' : ''}`}
                      title={event.description}
                    >
                      {event.event_time && <span className="font-semibold mr-1">{event.event_time.slice(0, 5)}</span>}
                      {event.description}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CalendarEventModal 
        isOpen={isModalOpen}
        initialDate={selectedDate || new Date()}
        eventToEdit={selectedEvent}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchEvents(); // reload events after save
        }}
      />
    </div>
  );
}
