import * as React from "react";

export default function Empty() {
  return (
    <>
      <img
        loading="lazy"
        src="/assets/svgs/empty_noti.svg"
        alt="No notifications illustration"
        className="object-contain self-center mt-40 max-w-full rounded-none aspect-[0.95] w-[198px]"
      />
      <div className="flex flex-col items-center w-full">
        <div className=" text-2xl font-semibold tracking-tight leading-none text-black">
          No Notifications Yet
        </div>
        <div className="pt-2 mt-4 w-full text-lg tracking-normal leading-6 text-gray-600 max-w-[364px]">
          You have no notifications yet. Stay tuned for updates and alerts that
          matter to you!
        </div>
      </div>
    </>
  );
}