"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNotification } from "./contexts/NotificationProvider";
import { useAuth } from "./contexts/AuthProvider";
import { ref, onValue, query, orderByKey, update } from "firebase/database"; // Use onValue for real-time updates
import { database } from "@/app/config/firebase";

export default function NotificationLayout({ children }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [error, setError] = useState(null);
  const notificationQueue = useRef([]); // A queue to store notifications
  const isProcessing = useRef(false); // Track if a notification is being processed

  useEffect(() => {
    // Delay the setup by 10 seconds
    const timeoutId = setTimeout(() => {
      if (!user) {
        return;
      }

      // Reference the "alerts" collection
      const alertsRef = ref(database, "alerts");
      const userAlertsQuery = query(alertsRef, orderByKey());

      // Set up a real-time listener using onValue
      onValue(
        userAlertsQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const alerts = snapshot.val();
            // Filter alerts by receiver matching user.uid and not already marked as read
            const newAlerts = Object.entries(alerts)
              .filter(
                ([key, value]) =>
                  value.receiver === user.uid && value.isRead === false
              )
              .map(([key, value]) => ({ id: key, ...value }));

            // Add new alerts to the notification queue
            newAlerts.forEach((alert) => {
              if (
                !notificationQueue.current.some((item) => item.id === alert.id)
              ) {
                notificationQueue.current.push(alert);
              }
            });

            // Start processing the notification queue
            processNotifications();
          } else {
            
          }
        },
        (error) => {
          // Handle errors during real-time listening
          console.error("Error listening to alerts:", error);
          setError(error);
        }
      );
    }, 10000); // Delay the execution by 10 seconds (10,000 milliseconds)

    // Cleanup function to clear the timeout when the component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [user]);

  // Function to process notifications one by one
  const processNotifications = async () => {
    if (isProcessing.current) {
      // If a notification is already being processed, exit
      return;
    }

    isProcessing.current = true; // Mark as processing

    while (notificationQueue.current.length > 0) {
      const currentNotification = notificationQueue.current.shift(); // Get the first notification in the queue
      // Show the notification
      showNotification({
        avatar1: currentNotification.sender_avatar,
        gift: currentNotification.gift_image,
        content: currentNotification.content,
      });
      // Mark the notification as read in the database
      const alertRef = ref(database, `alerts/${currentNotification.id}`);
      await update(alertRef, { isRead: true })
        .then(() => {
          
        })
        .catch((error) => {
          console.error(
            `Failed to update alert with ID ${currentNotification.id}:`,
            error
          );
        });

      // Wait for 7 seconds before showing the next notification
      await new Promise((resolve) => setTimeout(resolve, 7000));
    }

    isProcessing.current = false; // Mark as not processing
  };

  return <>{children}</>;
}
