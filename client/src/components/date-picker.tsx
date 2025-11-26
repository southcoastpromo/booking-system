import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
// UKDateDisplay removed as it's not used in this component

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

export const DatePickerComponent = ({
  value,
  onChange,
  placeholder,
  label,
  className = "w-44"
}: DatePickerProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Simple month navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newMonth;
    });
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to render calendar dates
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = 0; i < firstWeekday; i++) {
      days.push(<div key={`prev-${i}`} className="w-8 h-8" />);
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
      const isSelected = value === dateString;
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            onChange(dateString);
            setShowCalendar(false);
          }}
          className={`w-8 h-8 text-sm rounded-md transition-colors ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : isToday 
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                : 'text-gray-300 hover:bg-slate-600'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-xs sm:text-xs font-semibold text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={calendarRef}>
        <button
          type="button"
          onClick={() => {
            setShowCalendar(!showCalendar);
          }}
          className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white
                     focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
                     flex items-center justify-between touch-manipulation"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value || placeholder}
          </span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </button>

        {showCalendar && (
          <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-300" />
              </button>
              
              <h3 className="text-white font-medium">
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="w-8 h-8 text-xs text-gray-400 flex items-center justify-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
