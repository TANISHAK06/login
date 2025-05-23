import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatInterface = ({ userData }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm your AI assistant. How can I help you today?",
      sender: "system",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [theme, setTheme] = useState("blue");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const suggestions = [
    "Tell me about Financial updates?",
    "Send the email to anyone",
    "Search for machine learning basics",
    "Process this document for me",
  ];

  const themeClasses = {
    blue: {
      gradient: "from-blue-50 to-indigo-100",
      primary: "from-blue-500 to-indigo-600",
      secondary: "bg-blue-500",
      accent: "bg-indigo-500",
      text: "text-blue-800",
      highlight: "bg-blue-100",
      systemMessage:
        "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
      userMessage: "bg-gradient-to-r from-blue-500 to-indigo-600",
    },
    purple: {
      gradient: "from-purple-50 to-pink-100",
      primary: "from-purple-400 to-pink-500",
      secondary: "bg-purple-400",
      accent: "bg-pink-500",
      text: "text-purple-800",
      highlight: "bg-purple-100",
      systemMessage:
        "bg-gradient-to-r from-pink-100 to-purple-100 border-purple-300",
      userMessage: "bg-gradient-to-r from-pink-400 to-purple-300",
    },
    green: {
      gradient: "from-emerald-50 to-teal-100",
      primary: "from-emerald-500 to-teal-600",
      secondary: "bg-emerald-500",
      accent: "bg-teal-500",
      text: "text-emerald-800",
      highlight: "bg-emerald-100",
      systemMessage:
        "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200",
      userMessage: "bg-gradient-to-r from-emerald-500 to-teal-600",
    },
    dark: {
      gradient: "from-gray-800 to-gray-900",
      primary: "from-gray-700 to-gray-900",
      secondary: "bg-gray-700",
      accent: "bg-gray-600",
      text: "text-gray-300",
      highlight: "bg-gray-700",
      systemMessage:
        "bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600 text-gray-200",
      userMessage: "bg-gradient-to-r from-indigo-400 to-blue-700",
    },
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
    inputRef.current?.focus();
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 1000);
    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e, suggestedText = null) => {
    e && e.preventDefault();
    const messageText = suggestedText || inputMessage;
    if (!messageText.trim()) return;

    setShowSuggestions(false);
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: messageText }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();

      const systemMessage = {
        id: messages.length + 2,
        text: data.message || "I'm processing your request...",
        sender: "system",
        timestamp: new Date(),
        ...(data.results && { searchResults: data.results }),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, there was an error processing your request. Please try again.",
        sender: "system",
        error: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleDocumentProcessed = (message) => {
    setMessages((prev) => [...prev, message]);
    setIsProcessingDocument(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div
      className={`flex flex-col h-screen bg-gradient-to-br ${themeClasses[theme].gradient} transition-colors duration-700`}
    >
      <ChatHeader
        userData={userData}
        theme={theme}
        themeClasses={themeClasses}
        handleThemeChange={handleThemeChange}
        handleLogout={handleLogout}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading || isProcessingDocument}
        theme={theme}
        themeClasses={themeClasses}
        messagesEndRef={messagesEndRef}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        handleSendMessage={handleSendMessage}
        voiceEnabled={voiceEnabled}
      />

      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        theme={theme}
        themeClasses={themeClasses}
        inputRef={inputRef}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        onDocumentProcessed={handleDocumentProcessed}
        setIsProcessingDocument={setIsProcessingDocument}
      />
    </div>
  );
};

export default ChatInterface;
