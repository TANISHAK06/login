import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ParticleBackground from "./components/ParticleBackground";
import LoginForm from "./components/LoginForm";
import UserProfile from "./components/UserProfile";

// API base URL
const API_BASE_URL = "http://localhost:5000/api/";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

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
      <ParticleBackground />

      <Header />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        {userData ? (
          <UserProfile userData={userData} handleLogout={handleLogout} />
        ) : (
          <LoginForm
            credentials={credentials}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
          />
        )}
      </main>

      <footer className="relative z-10 py-4 text-center text-blue-600 text-sm">
        <div className="container mx-auto">
          <p>© 2025 Telio Labs. Frontend created by Tanishak Shukla.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
