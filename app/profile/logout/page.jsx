"use client";
import * as React from "react";
import { LogoutButton } from "./LogoutButton";
import { useRouter } from "next/navigation";
import { firebaseSignOut } from "@/app/utils/firebase/firebaseAuth";
import Modal from "@/app/components/Modal";

export default function LogoutDialog() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
      await firebaseSignOut();
      localStorage.clear();
      router.push("/auth/signin");
    } catch (e) {
      
      // Still redirect even if logout fails
      router.push("/auth/signin");
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  return (
    <div className="flex flex-col h-full items-center pt-16 w-full bg-opacity-80 max-w-[534px]">
      <div className=" flex overflow-hidden flex-col mt-52 w-full bg-white rounded-[32px_32px_0px_0px] absolute bottom-0 pb-2">
        <div className="flex flex-col mt-12 w-full">
          <Modal
            isOpen={true}
            overlayClassName="animate-slideUp"
            noCloseButton={true}
            onClose={handleCancel}
            animationDuration="1s"
          >
            <div className="flex flex-col px-6 pt-8 max-w-[600px]">
              <div className="flex flex-col justify-center items-center py-1 w-20 min-h-[80px] rounded-[999px]">
                <img
                  loading="lazy"
                  src="/assets/images/logout.png"
                  alt="Send a Gift to unlock chat"
                  className="object-contain w-full aspect-square scale-150"
                />
              </div>
              <div className="flex flex-col mt-6 w-full">
                <h1 className="text-[28px]">Log out?</h1>
                <p className="text-gray-600 text-[1.2rem]">
                  {" "}
                  Are you sure you want to log out of your account? Please
                  confirm to proceed.
                </p>
              </div>
              <div className="flex gap-4 items-start mt-6 w-full text-base font-medium tracking-normal leading-none">
                <LogoutButton
                  text="No, Cancel"
                  variant="secondary"
                  onClick={handleCancel}
                />
                <LogoutButton
                  text="Log Out"
                  variant="primary"
                  onClick={handleLogout}
                />
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}
