import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import annyang from "annyang";

const MessageInput = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
  theme,
  themeClasses,
  inputRef,
  voiceEnabled,
  setVoiceEnabled,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && annyang) {
      annyang.setLanguage("en-US");
    }
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleVoiceSearch = () => {
    setVoiceEnabled(false);
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.start();
      setIsListening(true);
      setError(null);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        setVoiceEnabled(true);
      };

      recognition.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        setIsListening(false);
        setError("Voice recognition failed. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else if (annyang) {
      setIsListening(true);
      setError(null);

      annyang.start({ autoRestart: false, continuous: false });

      annyang.addCallback("result", (phrases) => {
        setInputMessage(phrases[0]);
        setIsListening(false);
        setVoiceEnabled(true);
        annyang.abort();
      });

      annyang.addCallback("error", (err) => {
        console.error("Annyang error:", err);
        setIsListening(false);
        setError("Voice recognition failed. Please try again.");
        annyang.abort();
      });
    } else {
      setError("Your browser does not support voice recognition.");
    }
  };

  const isDarkTheme = theme === "dark";

  return (
    <div
      className={`border-t ${
        isDarkTheme
          ? "border-gray-700 bg-gray-900"
          : "border-gray-200 bg-gray-50"
      } py-4 px-4 transition-all duration-500`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.form
          onSubmit={handleSendMessage}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`relative flex items-center space-x-2 ${
            isFocused ? "transform scale-101" : ""
          } transition-all duration-300 rounded-lg ${
            isDarkTheme
              ? "bg-gray-800 shadow-md ring-1 ring-gray-700"
              : "bg-white shadow-md ring-1 ring-gray-100"
          }`}
        >
          <motion.input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            placeholder={
              isListening ? "Listening..." : "Type your message here..."
            }
            className={`flex-grow py-2 px-3 ${
              isDarkTheme
                ? "bg-gray-800 text-white placeholder-gray-500"
                : "bg-white text-gray-800 placeholder-gray-400"
            } rounded-lg border-none focus:ring-0 outline-none transition-all duration-300`}
          />

          <div className="flex items-center space-x-1 px-1">
            <motion.button
              type="button"
              onClick={handleVoiceSearch}
              disabled={isLoading || isListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-md ${
                isListening
                  ? `${isDarkTheme ? "bg-red-600" : "bg-red-500"} text-white`
                  : isLoading
                  ? `${
                      isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                    } text-gray-500`
                  : `${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`
              } transition-all duration-300`}
              title={isListening ? "Listening..." : "Voice input"}
            >
              <span className="flex items-center justify-center h-5 w-5">
                {isListening ? (
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </motion.svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-md transition-all duration-300 ${
                voiceEnabled
                  ? `${
                      isDarkTheme
                        ? `bg-gradient-to-r ${themeClasses[theme].accent} text-white`
                        : `bg-gradient-to-r ${themeClasses[theme].accent} text-white`
                    }`
                  : `${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-400"
                        : "bg-gray-200 text-gray-600"
                    }`
              }`}
              title={
                voiceEnabled ? "Voice output enabled" : "Voice output disabled"
              }
            >
              <span className="flex items-center justify-center h-5 w-5">
                {voiceEnabled ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
              </span>
            </motion.button>

            <motion.button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-md ${
                isLoading || !inputMessage.trim()
                  ? `${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-500"
                        : "bg-gray-200 text-gray-400"
                    } cursor-not-allowed`
                  : `${
                      isDarkTheme
                        ? `bg-gradient-to-r ${themeClasses[theme].primary} text-white`
                        : `bg-gradient-to-r ${themeClasses[theme].primary} text-white`
                    }`
              } transition-all duration-300`}
            >
              <span className="flex items-center justify-center h-5 w-5">
                {isLoading ? (
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </motion.svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </span>
            </motion.button>
          </div>
        </motion.form>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`text-xs ${
                isDarkTheme ? "text-red-400" : "text-red-600"
              } mt-2 text-center font-medium`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
          className={`text-xs ${
            isDarkTheme ? "text-gray-400" : "text-gray-500"
          } mt-1 text-center font-medium`}
        >
          Ask me about anything or tell me what you'd like me to do!
        </motion.p>
      </div>
    </div>
  );
};

export default MessageInput;
