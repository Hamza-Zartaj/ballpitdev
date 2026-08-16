import { useEffect, useState, useRef } from "react";
import AIChatBubble from "./AIChatBubble";
import { useAuth } from "../contexts/AuthProvider";

const Tab2 = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setInput("");
    setLoading(true);

    const newMessage = { content: input, isMe: true, time: Date.now() };
    setMessages((prev) => [...prev, newMessage]);

    // Create chat history array for context
    const chatHistory = [...messages, newMessage].map((msg) => ({
      role: msg.isMe ? "user" : "assistant",
      content: msg.content,
    }));

    // Log the entire form data before sending
    

    try {
      const response = await fetch(`/api/users/persona/test?id=${user.uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          chatHistory: chatHistory,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          content: data.message.content,
          isMe: false,
          time: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col flex-grow p-6 overflow-y-auto">
        {messages.map((message, index) => (
          <AIChatBubble
            key={index}
            content={message.content}
            isMe={message.isMe}
            time={message.created_at}
            className="mb-4"
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="w-full p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2 max-h-14">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex flex-grow mx-4
        px-4 py-6 border border-gray-300 rounded-full 
        focus:outline-none focus:ring-2 focus:ring-Primary-500"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black flex justify-center items-center p-2 text-white rounded-full disabled:opacity-50"
          >
            <img className="mr-1" src="/assets/svgs/send.svg" />
          </button>
        </form>
      </div>
    </>
  );
};

export default Tab2;
