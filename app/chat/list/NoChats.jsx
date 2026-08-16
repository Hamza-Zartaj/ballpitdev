"use client";
import Header from "@/app/components/Header";
import Button from "@/app/components/Button";
import MenuBar from "@/app/components/MenuBar";
import { useRouter } from "next/navigation";

const NoChats = () => {
  const router = useRouter();
  return (
    <>
      <Header text="Chat" />
      <div className="w-full flex justify-center items-center flex-grow flex-col p-8">
        <img className="w-30 h-40 mb-4" src="/assets/svgs/no-chats.svg" />
        <h1 className="mb-2">No chats yet</h1>
        <p className="text-center">
          You haven't started any chats yet. Once you do, your conversations
          will appear right here!
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/dashboard")}
          large
          type="primary"
          full
        >
          Back to Dashboard
        </Button>
      </div>
      <MenuBar />
    </>
  );
};

export default NoChats;
