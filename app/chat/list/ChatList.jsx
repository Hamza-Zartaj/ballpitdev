"use client";
import MenuBar from "@/app/components/MenuBar";
import moment from "moment";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useChat } from "@/app/contexts/ChatProvider";
import { Spinner } from "@/app/components/Spinner";
import { useEffect, useState } from "react";

const ChatListItem = ({
  name,
  status,
  lastMessage,
  unreadCount,
  time,
  onClick,
  isAI,
}) => {
  

  return (
    <div
      className="flex w-full mb-4 items-center cursor-pointer transition-all hover:bg-gray-50 p-2 rounded-lg"
      onClick={onClick}
    >
      <div className="flex flex-grow flex-col ml-4 max-sm:max-w-full">
        <div className="flex w-full justify-between items-center">
          <h1 className="text-[16px] font-medium">{name}</h1>
          <p className="text-Primary-500 text-[12px]">
            {moment(time).format("HH:mm")}
          </p>
        </div>
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center max-sm:max-w-full max-sm:w-full max-sm:text-ellipsis">
            {isAI && (
              <img
                className="h-4 w-4 mr-1.5"
                src="/assets/svgs/ai-persona.svg"
              />
            )}
            <p className="text-[14px] text-gray-600 truncate max-w-[45vw] sm:max-w-[300px]">
              {lastMessage || "No message"}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="text-white bg-Primary-500 text-[12px] rounded-full h-5 min-w-5 w-5 flex items-center justify-center px-[6px]">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatList = ({ chatList, stories }) => {
  const router = useRouter();
  

  const { setUrl, setRecipientName } = useChat();
  return (
    <div className="flex flex-col h-dvh bg-white">
      <Header text="Chat" />
      <div className="flex-grow overflow-auto pt-20 pb-10">
        <hr className="border-gray-100" />
        <div className="p-4">
          {chatList.map((item) => (
            <ChatListItem
              key={item.id}
              onClick={() => {
                setRecipientName(item.name);
                setUrl(item.id);
                router.push(`/chat/${item.id}`);
              }}
              name={item.name}
              status={item.status}
              lastMessage={item.lastMessage}
              unreadCount={item.unreadCount}
              time={item.time}
              isAI={item.isAI}
            />
          ))}
        </div>
      </div>
      <MenuBar />
    </div>
  );
};

export default ChatList;
