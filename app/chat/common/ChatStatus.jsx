"use client";

export const ONLINE = "online";
export const AWAY = "away";
export const BUSY = "busy";
export const OFFLINE = "offline";

const ChatStatus = (props) => {
  const { status } = props;
  switch (status) {
    case ONLINE:
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-green-600 mr-2"></span>
          <p className="text-xs">Online</p>
        </div>
      );
    case AWAY:
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></span>
          <p className="text-xs">Away</p>
        </div>
      );
    case BUSY:
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
          <p className="text-xs">Do Not Disturb</p>
        </div>
      );
    case OFFLINE:
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-gray-100 border-2 border-gray-300 mr-2"></span>
          <p className="text-xs">Offline</p>
        </div>
      );
    default:
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-gray-600 mr-2"></span>
          <p className="text-xs">Offline</p>
        </div>
      );
  }
};
export default ChatStatus;
