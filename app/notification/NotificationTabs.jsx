"use client";
import { useEffect, useState } from "react";
import Empty from "./Empty";
import Unread from "./Unread";
import Read from "./Read";
import { useAuth } from "@/app/contexts/AuthProvider";

export function NotificationTabs() {

  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("unread");
  const [read, setRead] = useState([]);
  const [unread, setUnread] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/notification?id=${user.uid}`, {
          method: "GET",
          headers: {
            'Content-Type': "application/json",
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        let notification = await response.json();
        let r = [];
        let u = [];
        if (notification) {
          notification.map((item) => item.isRead ? r.push(item) : u.push(item));
        }
        setRead(r);
        setUnread(u);
      } catch (error) {
        console.error('Error fetching interests:', error); // Handle errors
      }
    }
    if(session) fetchData();
  }, [session])

  const tabs = [
    { id: 'unread', label: 'Unread', length: unread.length || 0, isActive: true },
    { id: 'read', label: 'Read', length: read.length || 0, isActive: false }
  ];

  const readall = async () => {
    const response = await fetch(`/api/notification?id=${session.user.id}`, {
      method: "PUT",
      headers: {
        'Content-Type': "application/json",
      },
      body: JSON.stringify({
        isRead: true
      })
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    setUnread([]);
    setRead([...read, ...unread]);
  }
  return (
    <>
      <div className="flex gap-4 px-4 w-full text-base font-medium tracking-normal leading-none text-center whitespace-nowrap bg-white border-b border-zinc-200 min-h-[56px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            tabIndex={0}
            className={`flex-1 shrink self-stretch h-full ${activeTab == tab.id
              ? 'border-b-2 border-black text-zinc-950'
              : 'text-zinc-400'
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label + "(" + tab.length + ")"}
          </button>
        ))}
      </div>
      {
        activeTab == "unread" ? (
          unread.length > 0 ? (
            <>
              <Unread data={unread} />
              <div className="absolute px-6 bottom-0 left-0 flex flex-col pt-4 pb-6 w-full text-base font-medium tracking-normal leading-none text-white border border-solid border-zinc-200">
                <button
                  className="gap-2.5 self-stretch px-6 w-fxull bg-indigo-600 rounded-full min-h-[64px]"
                  aria-label="Mark all notifications as read"
                  onClick={() => readall()}
                >
                  Mark All as Read
                </button>
              </div>
            </>) : (<Empty />)
        ) : (
          read.length > 0 ? (
            <Read data={read} />
          ) : (
            <Empty />
          )
        )
      }
    </>
  );
}