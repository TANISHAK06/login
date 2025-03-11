import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import ChatInterface from "./components/ChatInterface";

// API base URL - can be moved to a config file or environment variable
export const API_BASE_URL = "http://127.0.0.0:8000";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Function to get user data from localStorage
export const getUserData = () => {
  const userDataString = localStorage.getItem("userData");
  if (!userDataString) return null;

  try {
    return JSON.parse(userDataString);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatInterface userData={getUserData()} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
