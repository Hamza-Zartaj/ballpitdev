"use client";
import * as React from "react";
import Header from "@/app/components/Header";
import MenuBar from "../../components/MenuBar";
import ProfileSetting from "./profilesetting";


export default function ProfileSettings() {
  return (
    <div className="flex flex-col h-dvh">
      <Header text="Profile Settings" routing="/profile" />
      <div className="flex-1 overflow-y-auto pt-[90px] pb-[80px]">
        <ProfileSetting />
      </div>
      <MenuBar />
    </div>
  );
}
