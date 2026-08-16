import { useState, useRef, useEffect } from "react";
import { z } from "zod";

const YearPicker = ({ selectedYear, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  const yearsPerPage = 12;
  const startYear = 1930;
  const endYear = new Date().getFullYear() - 14;
  const totalPages = Math.ceil((endYear - startYear + 1) / yearsPerPage);

  useEffect(() => {
    if (selectedYear) {
      const year = parseInt(selectedYear);
      if (!isNaN(year)) {
        const newPage = Math.floor((year - startYear) / yearsPerPage);
        setCurrentPage(Math.min(Math.max(0, newPage), totalPages - 1));
      }
    }
  }, [selectedYear, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateYear = (value) => {
    if (!value) return true;
    const yearNum = parseInt(value);
    if (isNaN(yearNum) || yearNum < startYear) {
      setError("Invalid year");
      return false;
    }
    if (yearNum > endYear) {
      setError("Must be older than 14 years");
      return false;
    }
    setError("");
    return true;
  };

  const handleYearInput = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      if (value.length <= 4) {
        onChange(value);
        if (value.length === 4) {
          validateYear(value);
        } else {
          setError("");
        }
      }
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-col space-y-2">
        <label className="pl-3 text-sm font-medium text-gray-700">Year</label>
        <input
          type="number"
          placeholder="YYYY"
          value={selectedYear || ""}
          onChange={handleYearInput}
          onClick={() => setIsOpen(true)}
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
        {error && <div className="text-red-500 text-sm pl-3">{error}</div>}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 right-0">
          <div className="bg-white rounded-[32px] p-6 shadow-lg border border-gray-200 min-w-[320px]">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: yearsPerPage }, (_, i) => {
                const year = startYear + currentPage * yearsPerPage + i;
                if (year <= endYear) {
                  return (
                    <button
                      key={year}
                      onClick={() => {
                        onChange(year.toString());
                        setIsOpen(false);
                        setError("");
                      }}
                      className={`p-3 rounded-full hover:bg-gray-100 text-sm ${
                        selectedYear === year.toString()
                          ? "bg-Primary-500 text-white"
                          : ""
                      }`}
                    >
                      {year}
                    </button>
                  );
                }
                return null;
              })}
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearPicker;
