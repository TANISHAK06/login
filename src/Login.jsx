import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
// API base URL
const API_BASE_URL = "http://localhost:5000/api/";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Generate animated particles for background effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.25,
      }));
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(() => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => ({
          ...particle,
          y: (particle.y + particle.speed) % 100,
          x: particle.x + Math.sin(particle.y / 10) * 0.1,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setUserData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store user token
      localStorage.setItem("token", data.token);

      // Set the user data to be displayed instead of redirecting
      setUserData(data);

      // We don't navigate away now
      // navigate("/dashboard");
    } catch (err) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem("token");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex flex-col">
      {/* Animated particles background */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-blue-300"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 4}px rgba(147, 197, 253, 0.7)`,
            animation: `pulse ${2 + Math.random() * 2}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: ${(props) => props.opacity || 0.3};
          }
          100% {
            transform: scale(1.2);
            opacity: ${(props) => (props.opacity || 0.3) + 0.2};
          }
        }
      `}</style>
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        {userData ? (
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

            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">
                API Response Data:
              </h3>
              <pre className="bg-white p-3 rounded border border-blue-100 overflow-auto max-h-64 text-sm">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 bg-blue-500 hover:bg-blue-400 shadow-md hover:shadow-blue-300/50 transform hover:-translate-y-1"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md border border-blue-200 transition-all duration-500 hover:shadow-2xl">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md transform transition-all duration-500 hover:scale-105">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-1 text-gray-800">
                Welcome Back
              </h2>
              <p className="text-blue-500">Login to access </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-600 px-3 py-2 rounded-lg mb-6 animate-bounce ">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-blue-600 font-medium mb-2 text-sm tracking-wide"
                >
                  USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-blue-50 text-gray-800 placeholder-gray-500 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-blue-600 font-medium mb-2 text-sm tracking-wide"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-blue-50 text-gray-800 placeholder-gray-500 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 ${
                  isLoading
                    ? "bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-400 shadow-md hover:shadow-blue-300/50 transform hover:-translate-y-1"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Authenticating...
                  </div>
                ) : (
                  "Login to Platform"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-blue-500 hover:text-blue-400 font-medium focus:outline-none transition-colors duration-300"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        )}
      </main>
      <footer className="relative z-10 py-4 text-center text-blue-600 text-sm">
        <div className="container mx-auto">
          <p>
            Be the part 😊 © 2025 Telio Labs. Powering next-generation
            intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default Login;
