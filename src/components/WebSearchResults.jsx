import React from "react";
import { motion } from "framer-motion";
import { FiExternalLink, FiClock, FiThumbsUp } from "react-icons/fi";

const WebSearchResults = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="search-results-container w-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border border-gray-100"
    >
      <div className="search-results-header bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 font-semibold text-lg flex items-center justify-between">
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search Results
        </span>
        <span className="text-sm opacity-75">
          {results.length} results found
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="search-results-list p-6 max-h-96 overflow-y-auto space-y-5"
      >
        {results.map((result, index) => (
          <motion.div
            key={index}
            variants={item}
            className="search-result-item p-4 rounded-xl bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-indigo-200"
          >
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                    <FiExternalLink className="text-white text-xl" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-indigo-600 font-semibold text-lg hover:underline">
                    {result.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiClock />
                      {result.date || "Recent"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiThumbsUp />
                      {result.relevance || "Relevant"}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                    {result.snippet}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.tags &&
                      result.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default WebSearchResults;
