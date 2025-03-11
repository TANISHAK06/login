import React from "react";
import { motion } from "framer-motion";

const ChatHeader = ({
  userData,
  theme,
  themeClasses,
  handleThemeChange,
  handleLogout,
}) => {
  return (
    <header
      className={`${
        theme === "dark" ? "bg-gray-800 shadow-gray-900" : "bg-white"
      } shadow-lg py-3 px-6 transition-colors duration-500`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`w-10 h-10 bg-gradient-to-r ${themeClasses[theme].primary} rounded-full flex items-center justify-center mr-3 shadow-lg`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </motion.div>
          <div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              } transition-colors duration-500`}
            >
              Welcome to Teliolabs LAM
            </motion.h1>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              } transition-colors duration-500`}
            >
              Powered by Advanced Large Action Model
            </motion.p>
          </div>
        </div>

        <div className="flex items-center">
          {/* Theme selector */}
          <div className="mr-4 hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleThemeChange("blue")}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-md hover:scale-110 transition-transform"
            ></button>
            <button
              onClick={() => handleThemeChange("purple")}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-md hover:scale-110 transition-transform"
            ></button>
            <button
              onClick={() => handleThemeChange("green")}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-md hover:scale-110 transition-transform"
            ></button>
            <button
              onClick={() => handleThemeChange("dark")}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 shadow-md hover:scale-110 transition-transform"
            ></button>
          </div>

          {userData && userData.role && (
            <motion.span
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`${themeClasses[theme].highlight} ${themeClasses[theme].text} text-sm font-medium px-3 py-1 rounded-full mr-4 shadow-sm`}
            >
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </motion.span>
          )}
          <motion.button
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className={`${themeClasses[theme].highlight} ${themeClasses[theme].text} text-sm font-bold px-3 py-1 rounded-full mr-4 shadow-sm`}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
