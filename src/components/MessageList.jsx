import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WebSearchResults from "./WebSearchResults";

const MessageList = ({
  messages,
  isLoading,
  theme,
  themeClasses,
  messagesEndRef,
  showSuggestions,
  suggestions,
  handleSendMessage,
  voiceEnabled,
}) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const speakingRef = useRef(null);

  const speakMessage = (messageText) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(messageText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (voice) =>
          voice.lang.includes("en") &&
          (voice.name.includes("Female") || voice.name.includes("Samantha"))
      ) ||
      voices.find((voice) => voice.lang.includes("en")) ||
      voices[0];

    if (preferredVoice) {
      speech.voice = preferredVoice;
    }

    speech.rate = 1.0;
    speech.pitch = 1.0;
    speakingRef.current = speech;
    window.speechSynthesis.speak(speech);
  };

  useEffect(() => {
    if (messages.length > 0 && voiceEnabled) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === "system" && !latestMessage.error) {
        speakMessage(latestMessage.text);
      }
    }
  }, [messages, voiceEnabled]);

  useEffect(() => {
    if (!voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex-grow p-4 md:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-xl lg:max-w-2xl px-5 py-4 rounded-2xl shadow-md ${
                    message.sender === "user"
                      ? `${themeClasses[theme].userMessage} text-white rounded-br-none transform hover:-translate-y-1 transition-transform duration-300`
                      : message.error
                      ? "bg-red-100 text-red-800 rounded-bl-none border border-red-200"
                      : `${themeClasses[theme].systemMessage} rounded-bl-none border transform hover:-translate-y-1 transition-transform duration-300`
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {message.sender === "system" && !message.error ? (
                      <div
                        className={`w-6 h-6 bg-gradient-to-r ${themeClasses[theme].primary} rounded-full flex items-center justify-center mr-2 shadow-sm`}
                      >
                        <span className="text-white text-lg">🤖</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-2 shadow-sm">
                        <span className="text-white text-lg">👨‍🦱</span>
                      </div>
                    )}
                    <span
                      className={`font-semibold text-sm ${
                        message.sender === "user"
                          ? "text-white"
                          : theme === "dark"
                          ? "text-gray-800"
                          : "text-gray-800"
                      }`}
                    >
                      {message.sender === "user" ? "You" : "LAM In Action"}
                    </span>
                    <span
                      className={`text-xs ml-2 ${
                        message.sender === "user"
                          ? "text-white text-opacity-80"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`text-sm md:text-base ${
                      message.sender === "system" && !message.error
                        ? theme === "dark"
                          ? "text-gray-300"
                          : "text-gray-700"
                        : ""
                    } leading-relaxed`}
                  >
                    {message.isDocument ? (
                      <div className="mt-2">
                        <div className="font-semibold">
                          Document: {message.documentData.filename}
                        </div>
                        <div className="text-xs mb-2">
                          Type: {message.documentData.file_type}
                        </div>
                        <div
                          className={`p-3 rounded-lg max-h-60 overflow-y-auto ${
                            theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <pre className="whitespace-pre-wrap text-sm">
                            {message.text}
                          </pre>
                          {/* <button
                            onClick={() =>
                              handleSendMessage(
                                null,
                                `Please summarize this document: ${message.documentData.extracted_text}`
                              )
                            }
                            className={`mt-2 px-3 py-1 text-xs rounded ${
                              theme === "dark"
                                ? "bg-gray-600 hover:bg-gray-500"
                                : "bg-blue-100 hover:bg-blue-200"
                            } transition-colors`}
                          >
                            Summarize Document
                          </button>*/}
                        </div>
                      </div>
                    ) : message.searchResults ? (
                      // Only render WebSearchResults if searchResults exist
                      <div className="mt-4">
                        <WebSearchResults results={message.searchResults} />
                      </div>
                    ) : (
                      // Regular message rendering
                      message.text.split("\n").map((paragraph, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-3" : ""}>
                          {paragraph}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div
                className={`${themeClasses[theme].systemMessage} px-5 py-4 rounded-2xl rounded-bl-none shadow-md max-w-xs`}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className={`w-3 h-3 rounded-full ${themeClasses[theme].secondary}`}
                  ></motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                    }}
                    className={`w-3 h-3 rounded-full ${themeClasses[theme].secondary}`}
                  ></motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: 0.4,
                    }}
                    className={`w-3 h-3 rounded-full ${themeClasses[theme].secondary}`}
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showSuggestions && messages.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-6 mb-2"
            >
              <p
                className={`text-sm mb-3 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Try asking about:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleSendMessage(e, suggestion)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : `${themeClasses[theme].highlight} ${themeClasses[theme].text}`
                    } shadow-md transition-all duration-300`}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageList;
