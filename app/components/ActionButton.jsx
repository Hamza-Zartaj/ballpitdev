import * as React from "react";

export default function ActionButton({ icon, label, variant, onClick }) {
  let bgColor, textColor;
  switch (variant) {
    case "primary":
      bgColor = "bg-indigo-600"; textColor = "text-white"; break;
    case "normal":
      bgColor = "bg-zinc-100"; textColor = "text-black"; break;
    case "Enable":
      bgColor = "bg-Success-500"; textColor = "text-white"; break;
    default:
      bgColor = "bg-black"; textColor = "text-white"; break;
  }
  return (
    <div className={`flex flex-1 shrink cursor-pointer overflow-hidden  justify-center items-center self-stretch px-6 my-auto whitespace-nowrap ${bgColor} ${textColor} basis-0 min-h-[60px] rounded-[80px]`} onClick={onClick}>
      {icon && (
        <img
          loading="lazy"
          src={icon}
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
        />
      )}
      <div className="gap-2.5 self-stretch px-2 my-auto">{label}</div>
    </div>
  );
}