import * as React from "react";
import NotificationItem from "./Item";

function Unread({ data }) {
  const formatTimestamp = (seconds, nanoseconds) => {
    const date = new Date(seconds * 1000); // Convert seconds to milliseconds
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  return (
    <div className="flex flex-col mx-auto w-full bg-white max-w-[550px] ">
      <div className=" max-h-[63vh] flex-col flex-1 px-4 w-full overflow-y-scroll">
        <div className="flex flex-col w-full pr-4">
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

export default Unread;
