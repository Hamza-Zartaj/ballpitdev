"use client";
import * as React from "react";
import { NotificationTabs } from "./NotificationTabs";
import Header from "../components/Header";
import MenuBar from "../components/MenuBar";

export default function NotificationsView() {
  return (
    <div className="flex flex-col h-dvh w-full bg-white max-w-full">
      <Header text="Notifications" />
      <div className="flex-grow overflow-y-auto pt-[120px] pb-[80px]">
        <NotificationTabs />
      </div>
      <MenuBar />
    </div>
  );
}
