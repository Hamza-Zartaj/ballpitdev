import * as React from "react";
import NotificationItem from "./Item";

const formatTimestamp = (seconds, nanoseconds) => {
  const date = new Date(seconds * 1000); // Convert seconds to milliseconds
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

function Read({ data }) {
  return (
    <div className="flex flex-col max-h-[75vh] mx-auto w-full bg-white max-w-[600px]">
      <div className="flex overflow-hidden flex-col flex-1 pl-4 justify-center w-full">
        <div className=" flex-col w-full overflow-y-scroll pr-6">
          {data.map((notification, index) => (
            <NotificationItem
              key={index}
              type={notification.type ? "purchase" : "refund"}
              time={formatTimestamp(
                notification.createdAt.seconds,
                notification.createdAt.nanoseconds
              )}
              title={notification.type ? "Coin Purchased" : "Gift Refund"}
              message={notification.message}
              amount={notification.coin}
              price={((Number(notification.coin) * 74) / 7000).toFixed(2)}
              recipient={notification.sender.name}
              read={notification.isRead}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Read;
