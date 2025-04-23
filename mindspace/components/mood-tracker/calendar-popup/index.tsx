import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Props interface
interface CalendarPopupProps {
  onSelectDate: (date: Date) => void;
  currentDate: Date;
  onClose: () => void;
}

// Month data for display
const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

export default function CalendarPopup({ onSelectDate, currentDate, onClose }: CalendarPopupProps) {
  const [selectedYear, setSelectedYear] = useState(() => currentDate.getFullYear());
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the popup to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Remove on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  
  // Navigate to previous year
  const handlePrevYear = () => {
    if (selectedYear > 2025) {
      setSelectedYear(prev => prev - 1);
    }
  };
  
  // Navigate to next year
  const handleNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (selectedYear < currentYear) {
      setSelectedYear(prev => prev + 1);
    }
  };
  
  // Handle month selection
  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelectDate(newDate);
    onClose();
  };
  
  // Check if we're at the earliest allowed date (Jan 2025)
  const isEarliestAllowedYear = selectedYear === 2025;
  
  // Check if we're at the current year
  const currentYear = new Date().getFullYear();
  const isCurrentYear = selectedYear === currentYear;
  
  return (
    <motion.div 
      key="calendar-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        key="calendar-content"
        className="bg-background rounded-xl shadow-lg p-6 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        ref={popupRef}
      >
        <motion.h3 
          className="text-xl font-semibold text-default-900 mb-4"
          layout
        >
          Select Month
        </motion.h3>
        
        {/* Year navigation */}
        <div className="flex justify-between items-center mb-6">
          <motion.button
            className={`p-2 rounded-full hover:bg-default-100 transition-colors ${isEarliestAllowedYear ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={handlePrevYear}
            disabled={isEarliestAllowedYear}
            whileHover={!isEarliestAllowedYear ? { scale: 1.1 } : {}}
            whileTap={!isEarliestAllowedYear ? { scale: 0.9 } : {}}
            aria-label="Previous year"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-default-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </motion.button>
          
          <h3 className="text-lg font-semibold text-default-800">{selectedYear}</h3>
          
          <motion.button
            className={`p-2 rounded-full hover:bg-default-100 transition-colors ${isCurrentYear ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={handleNextYear}
            disabled={isCurrentYear}
            whileHover={!isCurrentYear ? { scale: 1.1 } : {}}
            whileTap={!isCurrentYear ? { scale: 0.9 } : {}}
            aria-label="Next year"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-default-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        </div>
        
        {/* Months grid */}
        <div className="grid grid-cols-3 gap-4">
          <AnimatePresence>
            <motion.div 
              key={selectedYear}
              className="grid grid-cols-3 gap-4 w-full col-span-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ staggerChildren: 0.03, delayChildren: 0.01 }}
            >
              {months.map((month, index) => {
                // Check if this month is disabled (future months in current year)
                const isDisabled = isCurrentYear && index > new Date().getMonth();
                const isCurrentSelection = currentDate.getMonth() === index && 
                                          currentDate.getFullYear() === selectedYear;
                
                return (
                  <motion.button
                    key={`${month}-${index}`}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-colors
                      ${isCurrentSelection ? 'bg-primary text-white' : 'hover:bg-default-100'}
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !isDisabled && handleMonthSelect(index)}
                    disabled={isDisabled}
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    aria-label={`Select ${month}`}
                  >
                    {month}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
