import React, { useEffect, useState } from "react";

const UserProfile = ({ userData, handleLogout }) => {
  const [aiMessage, setAiMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Function to fetch AI message based on user role
    const fetchAiMessage = async () => {
      if (!userData || !userData.role || !userData.token) {
        setIsLoading(false);
        setError("Missing user data, role, or token");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/ai/${userData.role}/`,
          {
            method: "GET",
            headers: {
              "x-auth-token": userData.token,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setAiMessage(data.msg || "No message received");
      } catch (err) {
        setError(`Failed to fetch AI message: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAiMessage();
  }, [userData]); // This will run once when userData is set

  return (
    <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md border border-blue-200 transition-all duration-500 hover:shadow-2xl">
      <div className="mb-6 text-center">
        <div className="w-20 h-20 bg-green-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-1 text-gray-800">
          Login Successful
        </h2>
        <p className="text-green-500">Authentication completed</p>
      </div>

      <div className="space-y-5">
        {/* Role Badge */}
        {userData.role && (
          <div className="flex justify-center mb-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1.5 rounded-full">
              Role:{" "}
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </span>
          </div>
        )}

        {/* AI Message Section */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 rounded-lg border border-indigo-100 shadow-md transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            AI Response
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-100">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="relative bg-white p-5 rounded-lg shadow-inner border border-indigo-50">
              <div className="absolute -top-3 -left-3">
                <div className="w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-gray-700 font-medium leading-relaxed">
                {aiMessage.split("\n").map((line, index) => (
                  <p key={index} className={index > 0 ? "mt-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-50 text-xs text-indigo-400 italic">
                Generated specially for your {userData.role} profile
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 bg-blue-500 hover:bg-blue-400 shadow-md hover:shadow-blue-300/50 transform hover:-translate-y-1"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
