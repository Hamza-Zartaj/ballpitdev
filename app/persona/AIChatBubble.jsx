"use client";

import moment from "moment";

const AIChatBubble = ({ isMe, time, content, modal, className }) => {
  return (
    <div className={`w-full flex flex-col ${className}`}>
      <div className={`flex ${isMe ? "justify-end" : ""}`}>
        <div
          className={`p-4 rounded-t-3xl max-w-[80%] text-md break-words ${
            !isMe
              ? `rounded-br-3xl ${modal ? "bg-white" : "bg-Grey-800"}`
              : "rounded-bl-3xl bg-Primary-500 text-white"
          }`}
        >
          {content}
        </div>
      </div>
      <div
        className={`mt-2 flex items-center ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        <img className="h-6 w-6 mr-2.5" src="/assets/svgs/ai-persona.svg" />
        <p className={`text-sm font-satoshi`}>
          {moment(time).format("HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default AIChatBubble;
