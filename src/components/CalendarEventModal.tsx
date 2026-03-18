"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type CalendarEvent = {
  id?: string;
  event_type: string;
  description: string;
  notes?: string;
  event_date: string;
  event_time?: string | null;
  status?: string;
  assigned_to_role?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialDate?: Date;
  initialDescription?: string;
  eventToEdit?: CalendarEvent | null;
};

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
};

import { createClient } from '@/utils/supabase/client';

export default function CalendarEventModal({ isOpen, onClose, onSave, initialDate, initialDescription, eventToEdit }: Props) {
  const [eventType, setEventType] = useState(eventToEdit?.event_type || 'Appointment');
  const [description, setDescription] = useState(eventToEdit?.description || initialDescription || '');
  const [notes, setNotes] = useState(eventToEdit?.notes || '');
  const [date, setDate] = useState(eventToEdit ? eventToEdit.event_date : (initialDate ? initialDate.toISOString().split('T')[0] : ''));
  const [time, setTime] = useState(eventToEdit?.event_time || '');
  const [isCompleted, setIsCompleted] = useState(eventToEdit?.status === 'Completed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin/Supervisor specific state
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignType, setAssignType] = useState<'Me' | 'User' | 'Role'>('Me');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Reset form when modal opens or eventToEdit changes
  useEffect(() => {
    if (isOpen) {
      setEventType(eventToEdit?.event_type || 'Appointment');
      setDescription(eventToEdit?.description || initialDescription || '');
      setNotes(eventToEdit?.notes || '');
      setDate(eventToEdit ? eventToEdit.event_date : (initialDate ? initialDate.toISOString().split('T')[0] : ''));
      setTime(eventToEdit?.event_time || '');
      setIsCompleted(eventToEdit?.status === 'Completed');
      setError(null);
      
      // Fetch user profile and list of users if admin/supervisor
      fetchUserContext();
    }
  }, [isOpen, eventToEdit, initialDate, initialDescription]);

  const supabase = createClient();

  const fetchUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUserRole(profile.role);
        
        if (profile.role === 'Admin' || profile.role === 'Supervisor') {
          const response = await fetch('/api/admin/users');
          const data = await response.json();
          if (data.users) {
            setAllUsers(data.users);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user context:', err);
    }
  };

  const roles = [
    'Admin', 'Supervisor', 
    'Customer Service Rep', 'Sales Rep', 'Customer', 
    'Sales Rep/Customer Service Rep'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Not authenticated');

      const basePayload = {
        event_type: eventType,
        description,
        notes,
        event_date: date,
        event_time: time || null,
        status: isCompleted ? 'Completed' : 'Pending',
        last_modified_by: userData.user.id
      };

      if (eventToEdit?.id) {
        // Update existing (always individual)
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update(basePayload)
          .eq('id', eventToEdit.id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // New event
        if (assignType === 'Role' && selectedRole) {
          // Bulk insert for role
          const targetUsers = allUsers.filter(u => u.role === selectedRole);
          if (targetUsers.length === 0) throw new Error(`No users found with role: ${selectedRole}`);
          
          const payloads = targetUsers.map(u => ({
            ...basePayload,
            user_id: u.id,
            created_by: userData.user.id,
            assigned_to_role: selectedRole,
          }));

          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert(payloads);

          if (insertError) throw new Error(insertError.message);
        } else {
          // Single insert
          const targetUserId = assignType === 'User' ? selectedUserId : userData.user.id;
          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert({
              ...basePayload,
              user_id: targetUserId,
              created_by: userData.user.id,
              assigned_to_role: assignType === 'User' ? 'Individual' : null,
            });

          if (insertError) throw new Error(insertError.message);
        }
      }
      
      // Dispatch a custom event so other components (like Sidebar) can auto-refresh
      window.dispatchEvent(new Event('calendar-updated'));
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {eventType}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select 
              value={eventType} 
              onChange={(e) => setEventType(e.target.value)}
              className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="Appointment">Appointment</option>
              <option value="Task">Task</option>
              <option value="Event">Event</option>
            </select>
          </div>

          {eventToEdit?.assigned_to_role && (
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md">
              <p className="text-xs font-semibold text-indigo-700">
                Assigned to Group: {eventToEdit.assigned_to_role}
              </p>
            </div>
          )}

          {(currentUserRole === 'Admin' || currentUserRole === 'Supervisor') && !eventToEdit && (
            <div className="space-y-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Assign To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={assignType === 'Me'} onChange={() => setAssignType('Me')} />
                    Me
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={assignType === 'User'} onChange={() => setAssignType('User')} />
                    User
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={assignType === 'Role'} onChange={() => setAssignType('Role')} />
                    Role
                  </label>
                </div>
              </div>

              {assignType === 'User' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Select User</label>
                  <select 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full flex h-9 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="">-- Choose User --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}

              {assignType === 'Role' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Select Role</label>
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                    className="w-full flex h-9 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="">-- Choose Role --</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-600 font-medium">This will create a separate event for each user in this role.</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time (Optional)</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="E.g., Client Meeting"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Any additional details..."
            />
          </div>

          {eventToEdit && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="completed-status"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="completed-status" className="text-sm font-medium text-slate-700">
                Mark as Completed
              </label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
