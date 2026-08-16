// context/NotificationContext.jsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const Notification = ({
  id,
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match fade-out animation duration
  }, [onClose]);

  useEffect(() => {
    if (isPaused || isClosing || !duration) return;
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [isPaused, duration, handleClose, isClosing]);

  const variants = {
    success: "bg-green-100 border-green-600 text-green-600",
    error: "bg-red-100 border-red-600 text-red-600",
    info: "bg-Primary-800 border-Primary-500 text-Primary-500",
    warning: "bg-yellow-100 border-yellow-600 text-yellow-600",
  };

  const closeButtonColors = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-Primary-500",
    warning: "text-yellow-600",
  };

  return (
    <div
      className={`flex items-center p-4 rounded-full border-[1px] max-w-[450px] shadow-lg cursor-pointer hover:opacity-90 active:opacity-75 ${
        variants[type]
      } ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={handleClose}
    >
      <span className="mr-4 flex-1">{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        // className="ml-4 text-white hover:text-gray-200 text-lg"
        className={`ml-4 ${closeButtonColors[type]} hover:opacity-80 text-lg`}
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
};

export default Notification;

const NotificationContext = createContext();

export const NewNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, removeNotification }}
    >
      {children}
      {/* align center */}
      <div className="fixed top-10 right-1/2 translate-x-1/2 flex flex-col gap-2 z-50">
        {/* <div className="fixed top-4 right-4 flex flex-col gap-2 z-50"> */}
        {notifications.map((notification,index) => (
          <Notification
            key={index}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNewNotification = () => useContext(NotificationContext);
