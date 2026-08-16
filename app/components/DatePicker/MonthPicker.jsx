import { useState, useRef, useEffect } from "react";
import { z } from "zod";

const MonthPicker = ({ selectedMonth, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  const months = [
    { number: 1, name: "January" },
    { number: 2, name: "February" },
    { number: 3, name: "March" },
    { number: 4, name: "April" },
    { number: 5, name: "May" },
    { number: 6, name: "June" },
    { number: 7, name: "July" },
    { number: 8, name: "August" },
    { number: 9, name: "September" },
    { number: 10, name: "October" },
    { number: 11, name: "November" },
    { number: 12, name: "December" },
  ];

  const monthSchema = z
    .string()
    .refine((val) => /^\d{1,2}$/.test(val), "Invalid month format")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 12, "Month must be between 1 and 12.");

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateMonth = (value) => {
    try {
      monthSchema.parse(value);
      setError("");
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleMonthInput = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      if (value.length <= 2) {
        onChange(value);
        if (value.length === 2) {
          validateMonth(value);
        } else {
          setError("");
        }
      }
    }
  };

  const handleBlur = () => {
    if (selectedMonth) {
      validateMonth(selectedMonth.toString());
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-col space-y-2 relative">
        <label className="pl-3 text-sm font-medium text-gray-700">Month</label>
        <input
          type="number"
          placeholder="MM"
          value={selectedMonth || ""}
          onChange={handleMonthInput}
          onBlur={handleBlur}
          onClick={() => setIsOpen(true)}
          min="1"
          max="12"
          className={`pl-6 w-full p-3 border ${
            error ? "border-red-500" : "border-gray-300"
          } 
                    rounded-full focus:outline-none focus:ring-2 
                    ${error ? "focus:ring-red-500" : "focus:ring-Primary-500"}
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {error && (
          <div className="flex items-center gap-2 pl-2 mt-2">
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 transform -translate-x-1/2 left-1/2">
          <div className="bg-white rounded-[32px] p-6 shadow-lg border border-gray-200 min-w-[320px]">
            <div className="grid grid-cols-3 gap-2">
              {months.map(({ number, name }) => (
                <button
                  key={number}
                  onClick={() => {
                    onChange(number.toString().padStart(2, "0"));
                    setIsOpen(false);
                    setError("");
                  }}
                  className={`p-3 rounded-full hover:bg-gray-100 text-sm ${
                    selectedMonth === number.toString()
                      ? "bg-Primary-500 text-white"
                      : ""
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
