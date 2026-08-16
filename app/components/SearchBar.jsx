import React from "react";

const CustomInput = ({
    value,
    onChange,
    placeholder = "Search",
    onSearch, // Function to handle search (triggered by Enter or icon click)
    className = "", // Additional classes for customization
}) => {
    const handleSearchKeyPress = (e) => {
        if (e.key === "Enter" && onSearch) {
            onSearch();
        }
    };

    const handleSearchClick = () => {
        if (onSearch) {
            onSearch();
        }
    };

    return (
        <div
            className={`relative rounded-full bg-white border-[1.5px] border-[#dfdfe2] box-border h-14 flex flex-row items-center px-5 text-left text-base text-[#a9a9b2] font-mona focus-within:border-primary-500 transition-colors duration-500 ${className}`}
        >
            <img
                src="/assets/svgs/search.svg"
                alt="Search Icon"
                className="w-5 h-5 relative mr-3 transition-all duration-500 cursor-pointer"
                onClick={handleSearchClick} // Trigger search on icon click
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="bg-transparent outline-none border-none flex-grow leading-[150%] text-black font-mona placeholder-[#a9a9b2] focus:text-black"
                onKeyDown={handleSearchKeyPress} // Trigger search on Enter key press
                onFocus={(e) => {
                    const img = e.target.previousElementSibling; // Select the img element
                    img.style.filter =
                        "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(500%) hue-rotate(250deg) contrast(110%)";
                    img.style.transform = "scale(1.1)"; // Scale up slightly
                }}
                onBlur={(e) => {
                    const img = e.target.previousElementSibling; // Select the img element
                    img.style.filter =
                        "brightness(0) saturate(100%) invert(67%) sepia(80%) saturate(200%) hue-rotate(220deg) contrast(90%)"; // Back to grey
                    img.style.transform = "scale(1.1)"; // Reset scale
                }}
            />
        </div>
    );
};

export default CustomInput;