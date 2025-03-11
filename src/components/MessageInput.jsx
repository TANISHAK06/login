import React from "react";
import { motion } from "framer-motion";

const MessageInput = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
  theme,
  themeClasses,
  inputRef,
}) => {
  return (
    <div
      className={`border-t ${
        theme === "dark"
          ? "border-gray-700 bg-gray-800"
          : "border-gray-200 bg-white"
      } p-4 transition-colors duration-500`}
    >
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-3"
        >
          <motion.input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message here..."
            className={`flex-grow p-4 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                : "bg-gray-50 text-gray-700 border-gray-300 focus:ring-blue-400"
            } rounded-xl border focus:ring-2 focus:border-transparent outline-none transition-all duration-300 shadow-inner`}
            initial={{ scale: 0.98 }}
            whileFocus={{ scale: 1 }}
            animate={{ scale: 1 }}
          />
          <motion.button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-xl shadow-md ${
              isLoading || !inputMessage.trim()
                ? `${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-300 text-gray-500"
                  } cursor-not-allowed`
                : `bg-gradient-to-r ${themeClasses[theme].primary} text-white hover:shadow-lg transition-all duration-300`
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              rotate="reverse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </motion.button>
        </form>
        <p
          className={`text-xs ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          } mt-2 text-center`}
        >
          Ask me about anything or you can even ask me to perform anything !!!
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
