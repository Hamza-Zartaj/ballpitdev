import { useState, useEffect, useRef } from "react";
import { z } from "zod";

const DayPicker = ({ selectedDay, onChange, selectedMonth, selectedYear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  const daySchema = z
    .string()
    .refine((val) => /^\d{1,2}$/.test(val), "Invalid day format")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 31, "Day must be between 1 and 31.");

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-adjust day when month or year changes
  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const daysInMonth = new Date(
        parseInt(selectedYear, 10),
        parseInt(selectedMonth, 10),
        0
      ).getDate();

      const currentDay = parseInt(selectedDay, 10);
      if (currentDay > daysInMonth) {
        onChange(daysInMonth.toString().padStart(2, "0"));
      }
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const validateDay = (value) => {
    try {
      daySchema.parse(value);
      if (selectedMonth && selectedYear) {
        const daysInMonth = new Date(
          parseInt(selectedYear, 10),
          parseInt(selectedMonth, 10),
          0
        ).getDate();

        const dayNum = parseInt(value, 10);
        if (dayNum > daysInMonth) {
          setError(`Invalid day for selected month`);
          return false;
        }
      }
      setError("");
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleDayInput = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      if (value.length <= 2) {
        if (!value || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 31)) {
          onChange(value);
          if (value.length === 2) {
            validateDay(value);
          } else {
            // setError('');
          }
        }
      }
    }
  };

  const handleBlur = () => {
    if (selectedDay) {
      validateDay(selectedDay);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-col space-y-2 relative">
        <label className="pl-3 text-sm font-medium text-gray-700">Day</label>
        <input
          type="number"
          placeholder="DD"
          value={selectedDay || ""}
          onChange={handleDayInput}
          onBlur={handleBlur}
          onClick={() => setIsOpen(true)}
          min="1"
          max="31"
          className={`pl-6 w-full p-3 border ${
            error ? "border-red-500" : "border-gray-300"
          } 
                             rounded-full focus:outline-none focus:ring-2 
                             ${
                               error
                                 ? "focus:ring-red-500"
                                 : "focus:ring-Primary-500"
                             }
                             [appearance:textfield] 
                             [&::-webkit-outer-spin-button]:appearance-none 
                             [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {error && (
          <div className="flex items-center gap-2 pl-2 mt-2">
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0">
          <div className="bg-white rounded-[32px] p-6 shadow-lg border border-gray-200 min-w-[320px]">
            <div className="grid grid-cols-7 gap-2">
              {Array.from(
                { length: new Date(selectedYear, selectedMonth, 0).getDate() },
                (_, i) => i + 1
              ).map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    onChange(day.toString().padStart(2, "0"));
                    setIsOpen(false);
                    setError("");
                  }}
                  className={`p-3 rounded-full text-sm flex items-center justify-center hover:bg-gray-100 
                    ${
                      selectedDay ===
                      day.toString().padStart(2, "0")
                        ? "bg-Primary-500 text-white"
                        : ""
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayPicker;
