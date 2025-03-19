import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WebSearchResults from "./WebSearchResults"; // Import the WebSearchResults component

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

  // Create a ref for the currently speaking message
  const speakingRef = useRef(null);

  // Function to speak the message text
  const speakMessage = (messageText) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create a new speech instance
    const speech = new SpeechSynthesisUtterance(messageText);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    // Try to find a good voice - preferably a female voice
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

    // Store the speech instance in ref
    speakingRef.current = speech;

    // Speak the text
    window.speechSynthesis.speak(speech);
  };

  // Effect to handle speaking the latest system message
  useEffect(() => {
    if (messages.length > 0 && voiceEnabled) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === "system" && !latestMessage.error) {
        speakMessage(latestMessage.text);
      }
    }
  }, [messages, voiceEnabled]);

  // Effect to cancel speech when voice is disabled
  useEffect(() => {
    if (!voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  // Effect to clean up speech on component unmount
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

                    {/* Add play button for system messages */}
                    {/*message.sender === "system" && !message.error && (
                      <motion.button
                        onClick={() => speakMessage(message.text)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`ml-auto text-sm p-1 rounded-full ${
                          theme === "dark"
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                        title="Play message"
                      >
                        🔊
                      </motion.button>
                    )*/}
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
                    {message.text.split("\n").map((paragraph, idx) => (
                      <p key={idx} className={idx > 0 ? "mt-3" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Render WebSearchResults if search results are present */}
                  {message.searchResults && (
                    <div className="mt-4">
                      <WebSearchResults results={message.searchResults} />
                    </div>
                  )}
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

        {/* Quick suggestions */}
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
