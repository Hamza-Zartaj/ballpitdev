"use client";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";

function EditDescription() {
  const { user, updateUser } = useAuth()
  const [description, setDescription] = useState(user.description);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const cont = async () => {
    const response = await fetch(`/api/users?id=${user.uid}`, {
      method: "PUT",
      headers: {
        'Content-Type': "application/json",
      },
      body: JSON.stringify({
        description: description
      })
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const updatedUser = await response.json();

    if (updateUser) {
      updateUser({
        description: updatedUser.description
      });
    }

    router.push("/profile/setting");
  }
  return (
    <div className="flex overflow-hidden relative flex-col mx-auto w-full bg-white max-w-lg min-h-screen">
      <Header text="Edit Description" routing="/profile/setting" />
      <div className="flex z-0 flex-col py-[17vh] px-6 pt-10 pb-6 w-full">
        <div className="flex flex-col w-full">
          <h1 className="text-3xl font-semibold tracking-tighter leading-none text-black">
            Edit your description
          </h1>
          <p className="mt-4 text-gray-600">
            Talk a bit about yourself, share your interests and hobbies to help
            others know you better and improve your chances of finding a match!
          </p>
        </div>
        <div className="space-y-4 flex flex-col flex-grow">
          <div
            className={`w-full h-[40vh] mt-4 pr-1 pb-1 pl-2 pt-1.5 border-[1.2px] rounded-2xl resize-none focus-within:border-purple-500 text-gray-700`}
            style={{ borderColor: isFocused ? '#5b49ef' : '#e5e7eb' }}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Type something..."
              className="w-full h-full pr-1 pb-1 pl-2 pt-1.5 resize-none focus:outline-none text-gray-700"
              onFocus={() => setIsFocused(true)} // Set focus state to true
              onBlur={() => setIsFocused(false)} // Reset focus state to false
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-[3rem] flex z-0 flex-col px-6 py-6 w-full text-base font-medium tracking-normal leading-none text-white whitespace-nowrap">
        <button
          className="gap-2.5 self-stretch px-6 w-full bg-indigo-600 rounded-full min-h-16"
          type="submit"
          onClick={() => cont()}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default EditDescription;