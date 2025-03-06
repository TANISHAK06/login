import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";

// API base URL - can be moved to a config file or environment variable
export const API_BASE_URL = "http://127.0.0.0:8000";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/login" />} />
        {/* Add other routes like dashboard here */}
      </Routes>
    </Router>
  );
}

export default App;
