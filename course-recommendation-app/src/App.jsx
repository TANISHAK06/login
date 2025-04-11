import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [userInput, setUserInput] = useState("");
  const [recommendations, setRecommendations] = useState([
    {
      course: "",
      url: "",
      description: "",
      match: 0,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);

  // State for image slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    "https://images.unsplash.com/photo-1736496503629-2d64fafca24e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1741699428519-d43b778f4d3c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  // Counter animation effect
  useEffect(() => {
    const duration = 2000; // 2 seconds for the animation
    const coursesTarget = 1000;
    const satisfactionTarget = 92;
    const categoriesTarget = 50;

    const coursesInterval = setInterval(() => {
      setCoursesCount((prev) => {
        const newValue = prev + Math.ceil(coursesTarget / 20);
        return newValue >= coursesTarget ? coursesTarget : newValue;
      });
    }, duration / 20);

    const satisfactionInterval = setInterval(() => {
      setSatisfactionRate((prev) => {
        const newValue = prev + Math.ceil(satisfactionTarget / 20);
        return newValue >= satisfactionTarget ? satisfactionTarget : newValue;
      });
    }, duration / 20);

    const categoriesInterval = setInterval(() => {
      setCategoriesCount((prev) => {
        const newValue = prev + Math.ceil(categoriesTarget / 20);
        return newValue >= categoriesTarget ? categoriesTarget : newValue;
      });
    }, duration / 20);

    // Cleanup
    return () => {
      clearInterval(coursesInterval);
      clearInterval(satisfactionInterval);
      clearInterval(categoriesInterval);
    };
  }, []);

  // Image slider effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Sample data with more details
  useEffect(() => {
    // Simulate API fetch with timeout
    const fetchData = async () => {
      try {
        // These would typically come from an API
        setCategories([
          { id: 1, name: "Web Development", icon: "🌐", color: "#4f46e5" },
          { id: 2, name: "Data Science", icon: "📊", color: "#06b6d4" },
          { id: 3, name: "Mobile Dev", icon: "📱", color: "#ec4899" },
          { id: 4, name: "Machine Learning", icon: "🤖", color: "#f59e0b" },
          { id: 5, name: "UI/UX Design", icon: "🎨", color: "#10b981" },
          { id: 6, name: "Business", icon: "💼", color: "#8b5cf6" },
          { id: 7, name: "Cybersecurity", icon: "🔒", color: "#ef4444" },
          { id: 8, name: "Cloud Computing", icon: "☁️", color: "#3b82f6" },
        ]);

        setFeaturedCourses([
          {
            id: 1,
            title: "Complete Web Development Bootcamp 2024",
            instructor: "Jane Doe",
            rating: 4.8,
            students: 12500,
            duration: "62 hours",
            level: "Beginner",
            price: "$89.99",
            discount: "$199.99",
            image:
              "https://images.unsplash.com/photo-1737408011230-995d7a7aca1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            category: "Web Development",
          },
          {
            id: 2,
            title: "Machine Learning A-Z with Python",
            instructor: "John Smith",
            rating: 4.9,
            students: 18200,
            duration: "44 hours",
            level: "Intermediate",
            price: "$94.99",
            discount: "$249.99",
            image:
              "https://images.unsplash.com/photo-1718241905696-cb34c2c07bed?q=80&w=1228&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            category: "Machine Learning",
          },
          {
            id: 3,
            title: "React - The Complete Guide (Hooks, Redux)",
            instructor: "Alex Johnson",
            rating: 4.7,
            students: 9800,
            duration: "52 hours",
            level: "Intermediate",
            price: "$84.99",
            discount: "$179.99",
            image:
              "https://images.unsplash.com/photo-1687603921109-46401b201195?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            category: "Web Development",
          },
          {
            id: 4,
            title: "Data Science & Deep Learning for Beginners",
            instructor: "Maria Garcia",
            rating: 4.6,
            students: 7500,
            duration: "38 hours",
            level: "Beginner",
            price: "$79.99",
            discount: "$169.99",
            image:
              "https://images.unsplash.com/photo-1742072594003-abf6ca86e154?q=80&w=1097&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            category: "Data Science",
          },
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, []);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.length < 3 && selectedCategories.length === 0) {
      setError(
        "Please provide more details (at least 3 characters) or select categories."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const selectedCategoryNames = categories
        .filter((cat) => selectedCategories.includes(cat.id))
        .map((cat) => cat.name)
        .join(", ");

      const fullUserInput =
        userInput +
        (selectedCategoryNames
          ? userInput
            ? `. Interested in: ${selectedCategoryNames}`
            : `Interested in: ${selectedCategoryNames}`
          : "");

      // Call your backend API
      const response = await axios.post("http://127.0.0.1:8000/recommend", {
        query: fullUserInput,
      });

      // Transform the backend response into the format with frontend expects
      const recommendations = response.data.top_recommendations.map((rec) => ({
        course: rec.course,
        url: rec.url,
        description: rec.llm_suggestion, // Using the LLM suggestion for all recommendations
        match: rec.score,
      }));
      console.log(recommendations);
      setRecommendations(recommendations);
      setSearchHistory((prev) => [
        {
          query: userInput,
          categories: selectedCategoryNames,
          date: new Date(),
        },
        ...prev.slice(0, 4),
      ]);
      setShowRecommendations(true);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to get recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  // Function to handle chatbot click
  const [isClicked, setIsClicked] = useState(false);

  const handleChatbotClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
    window.location.href = "http://localhost:5174";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 relative">
      {/* Animated Header with Enhanced Gradient */}
      <motion.header
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          <motion.div
            className="absolute top-10 left-20 w-32 h-32 rounded-full bg-white blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-24 w-40 h-40 rounded-full bg-indigo-300 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 10, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center relative z-10">
          <motion.div
            className="flex flex-col"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="flex items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 120,
              }}
            >
              <motion.span
                className="text-4xl mr-2"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                whileHover={{
                  rotate: [0, -10, 10, -5, 0],
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
              >
                📚
              </motion.span>
              <motion.h1
                className="text-4xl font-extrabold tracking-tight"
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.3 },
                }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 filter drop-shadow-lg font-sans">
                  Telio<span className="font-light">Labs</span>
                </span>
              </motion.h1>
            </motion.div>
            <motion.p
              className="text-indigo-200 mt-1 font-light tracking-wider text-sm uppercase letter-spacing-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.span
                className="inline-block"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                Your personalized learning companion
              </motion.span>
            </motion.p>
          </motion.div>

          <motion.nav
            className="hidden md:block"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ul className="flex space-x-8">
              {["Features", "Find Courses", "Trending"].map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400 },
                  }}
                >
                  <a
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="text-indigo-100 hover:text-white transition duration-300 relative group py-1 font-medium tracking-wide text-sm uppercase"
                  >
                    <motion.span
                      className="relative"
                      whileHover={{
                        y: -2,
                      }}
                    >
                      {item}
                      <motion.span
                        className="absolute left-0 bottom-0 w-full h-0.5 bg-white origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{
                          scaleX: 1,
                          transition: { duration: 0.3 },
                        }}
                      />
                    </motion.span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          {/* Enhanced mobile menu button */}
          <motion.div
            className="md:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className="text-white p-2 rounded-lg focus:outline-none border border-indigo-400 bg-indigo-800 bg-opacity-30 backdrop-blur-sm flex items-center">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </motion.div>
              <motion.span
                className="ml-2 text-sm font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Menu
              </motion.span>
            </button>
          </motion.div>
        </div>

        {/* Subtle animated border bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.header>
      {/* Hero Section*/}
      <section className="bg-indigo-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-20 -left-20 bg-indigo-300 rounded-full w-64 h-64"></div>
          <div className="absolute top-40 right-20 bg-purple-300 rounded-full w-96 h-96"></div>
          <div className="absolute bottom-10 left-1/3 bg-indigo-400 rounded-full w-72 h-72"></div>
        </div>

        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Discover Courses That{" "}
              <span className="text-indigo-200">Transform Your Future</span>
            </h2>
            <p className="text-xl mb-8 text-indigo-100 font-light leading-relaxed">
              Our AI-powered recommendation engine analyzes your goals and
              learning style to find the perfect courses for your career
              journey.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <a
                href="#find-courses"
                className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-medium hover:bg-indigo-50 transition duration-300 shadow-lg transform hover:-translate-y-1"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="backdrop-blur-sm bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition duration-300 transform hover:-translate-y-1"
              >
                How It Works
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="backdrop-blur-sm bg-white/10 border border-white/30 p-5 rounded-xl">
                <div className="text-3xl font-bold">{coursesCount}+</div>
                <div className="text-indigo-200 text-sm mt-1">
                  Courses Analyzed
                </div>
              </div>
              <div className="backdrop-blur-sm bg-white/10 border border-white/30 p-5 rounded-xl">
                <div className="text-3xl font-bold">{satisfactionRate}%</div>
                <div className="text-indigo-200 text-sm mt-1">
                  Satisfaction Rate
                </div>
              </div>
              <div className="backdrop-blur-sm bg-white/10 border border-white/30 p-5 rounded-xl">
                <div className="text-3xl font-bold">{categoriesCount}+</div>
                <div className="text-indigo-200 text-sm mt-1">
                  Learning Categories
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="hidden md:block relative h-96"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {slides.map((slide, index) => (
              <img
                key={index}
                src={slide}
                alt={`Telio slide ${index + 1}`}
                className={`absolute inset-0 rounded-2xl shadow-2xl border-4 border-white/20 transform rotate-2 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </motion.div>
        </div>
      </section>
      {/* Features Section */}
      <section
        id="features"
        className="py-28 bg-gradient-to-b from-white to-indigo-50"
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-indigo-600 font-semibold mb-2 block">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
              Elevate Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Learning Experience
              </span>
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg max-w-3xl mx-auto">
              Our AI-powered platform transforms how you discover and engage
              with educational content, making your journey both efficient and
              rewarding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-indigo-100 transition-all duration-300 overflow-hidden group"
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 group-hover:text-indigo-700 transition-colors">
                  Personalized Matching
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  Our advanced algorithm analyzes your skills, goals, and
                  preferences to curate courses that perfectly match your
                  learning style and career trajectory.
                </p>
                <div className="mt-6">
                  <span className="inline-block h-1 w-10 bg-indigo-500 rounded-full group-hover:w-16 transition-all duration-300"></span>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-indigo-100 transition-all duration-300 overflow-hidden group"
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 group-hover:text-blue-700 transition-colors">
                  Save Valuable Time
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  Eliminate decision fatigue with our smart recommendations,
                  letting you focus on learning rather than endless platform
                  browsing.
                </p>
                <div className="mt-6">
                  <span className="inline-block h-1 w-10 bg-blue-500 rounded-full group-hover:w-16 transition-all duration-300"></span>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-indigo-100 transition-all duration-300 overflow-hidden group"
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 group-hover:text-purple-700 transition-colors">
                  Career-Focused Learning
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  We prioritize courses with direct industry applications,
                  ensuring your education translates to measurable career
                  advancement.
                </p>
                <div className="mt-6">
                  <span className="inline-block h-1 w-10 bg-purple-500 rounded-full group-hover:w-16 transition-all duration-300"></span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Animated decorative elements */}
          <div className="absolute left-0 top-1/4 -translate-y-1/2 opacity-10">
            <svg
              width="400"
              height="400"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M40,-60C52.1,-49.3,62.2,-37.3,68.2,-22.8C74.2,-8.3,76.1,8.7,70.7,22.9C65.3,37.1,52.6,48.5,38.1,58.1C23.6,67.7,7.3,75.5,-8.5,82.3C-24.3,89.1,-48.6,94.9,-61.7,84.9C-74.8,74.8,-76.7,48.8,-76.3,25.9C-75.9,2.9,-73.2,-17.1,-63.3,-32.7C-53.4,-48.3,-36.4,-59.6,-21.6,-69.1C-6.8,-78.6,5.8,-86.4,20.1,-84.1C34.4,-81.8,50.4,-69.5,60.5,-54.5Z"
                fill="#6366F1"
                stroke="none"
                strokeWidth="0"
                initial={{ pathLength: 0, rotate: 0 }}
                animate={{ pathLength: 1, rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>
        </div>
      </section>
      {/* Featured Courses */}
      <section
        id="trending"
        className="py-28 bg-white relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-indigo-600 font-semibold mb-2 block">
              Hot Right Now
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
              Trending{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                This Week
              </span>
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg max-w-3xl mx-auto">
              Discover the most popular courses professionals are using to
              accelerate their careers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCourses.map((course, index) => (
              <motion.div
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100 relative"
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 20px 40px -10px rgba(79, 70, 229, 0.3)",
                }}
              >
                {/* Course image*/}
                <div className="relative overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg z-10">
                    {course.category}
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <button className="bg-white/90 text-indigo-600 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:scale-110">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3 text-gray-800 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                    {course.title}
                  </h3>

                  {/* Instructor */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 overflow-hidden">
                      {course.instructorImage ? (
                        <img
                          src={course.instructorImage}
                          alt={course.instructor}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{course.instructor}</p>
                  </div>

                  {/* Rating and Level */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(course.rating)
                                ? "text-amber-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        {course.rating}
                        <span className="text-gray-500 text-xs ml-1">
                          ({Math.floor(course.students / 1000)}k+)
                        </span>
                      </span>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        course.level === "Beginner"
                          ? "bg-blue-100 text-blue-800"
                          : course.level === "Intermediate"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {course.level}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center text-gray-500 text-sm mb-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {course.duration}
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-indigo-600 font-bold text-xl">
                        {course.price}
                      </span>
                      {course.discount && (
                        <span className="text-gray-400 text-sm line-through ml-2">
                          {course.discount}
                        </span>
                      )}
                    </div>
                    <motion.button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Course
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Recommendation */}
      <section
        id="find-courses"
        className="py-28 bg-white relative overflow-hidden"
      >
        {/* Abstract background elements*/}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute bottom-0 right-0 bg-indigo-600 w-96 h-96 rounded-full transform translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/4 left-0 bg-purple-600 w-64 h-64 rounded-full transform -translate-x-1/2"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-16">
              <span className="text-indigo-600 font-semibold mb-2 block">
                Discover Learning Paths
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
                Find Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Perfect Course
                </span>
              </h2>
              <p className="text-center text-gray-600 mb-12 text-lg max-w-3xl mx-auto">
                Tell us what you're interested in or explore our curated
                categories
              </p>
            </div>

            {/* Categories animation */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              viewport={{ once: true }}
            >
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  className={`flex items-center px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategories.includes(category.id)
                      ? "text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  style={{
                    backgroundColor: selectedCategories.includes(category.id)
                      ? category.color
                      : "#f3f4f6",
                    boxShadow: selectedCategories.includes(category.id)
                      ? `0 10px 25px -5px ${category.color}60`
                      : "none",
                  }}
                >
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.name}
                  {selectedCategories.includes(category.id) && (
                    <motion.span
                      className="ml-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

              <div className="relative mb-8">
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                  Describe your learning goals
                </h3>
                <p className="text-gray-500 text-sm">
                  Be specific for better recommendations
                </p>
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 w-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>

              <div className="relative mb-6">
                <textarea
                  placeholder=" "
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={5}
                  className="w-full p-5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-300 text-gray-700 peer"
                />
                <label className="absolute left-4 top-2 px-1 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-indigo-600 peer-focus:transform peer-focus:-translate-y-5 peer-focus:scale-90 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0">
                  Example: "I want to learn web development with React..."
                </label>
              </div>

              {error && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-red-500 bg-red-50 p-4 rounded-lg flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Analyzing your goals...
                    </>
                  ) : (
                    "Get Personalized Recommendations"
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </motion.button>
            </motion.form>

            {/*search history */}
            {searchHistory.length > 0 && (
              <motion.div
                className="max-w-3xl mx-auto mt-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-gray-800 text-lg flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-indigo-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Your Recent Searches
                    </h4>
                    <button
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                      onClick={() => setSearchHistory([])}
                    >
                      Clear all
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {searchHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all duration-300 group"
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                            {index + 1}
                          </div>
                          <span className="text-gray-800 font-medium">
                            {item.query || "Categories: " + item.categories}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 text-sm bg-white px-3 py-1 rounded-md mr-3">
                            {item.date.toLocaleDateString()}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity duration-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
      {/* Results Section */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.section
            className="py-24 bg-gradient-to-b from-gray-50 to-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              opacity: 0,
              y: -20,
              transition: { duration: 0.3 },
            }}
          >
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                <motion.h2
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: 0.2 },
                  }}
                >
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Your Recommended Courses
                  </span>
                </motion.h2>
                <motion.button
                  className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  onClick={() => setShowRecommendations(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: 0.3 },
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Back to Search
                </motion.button>
              </div>

              <div className="grid gap-8">
                {recommendations.map((rec, index) => (
                  <motion.div
                    className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row"
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: index * 0.1,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      transition: { duration: 0.3 },
                    }}
                  >
                    <div className="h-48 md:h-auto md:w-64 md:min-w-64 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                      <motion.img
                        className="w-full h-full object-cover"
                        src={
                          rec.imageUrl ||
                          "https://images.unsplash.com/photo-1741699428553-41c8e5bd894d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        }
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          transition: { delay: index * 0.1 + 0.3 },
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                        {rec.category || "Development"}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-2">
                        <div>
                          <h3 className="font-bold text-xl text-gray-800">
                            {rec.course}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {rec.instructor || "By Our Best Instructor"}
                          </p>
                        </div>
                        <motion.div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center whitespace-nowrap"
                          initial={{ scale: 0.8 }}
                          animate={{
                            scale: 1,
                            transition: { delay: index * 0.1 + 0.5 },
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {Math.round(rec.match * 100)}%
                        </motion.div>
                      </div>

                      {/* Enhanced Description with Heading Support */}
                      <div className="text-gray-600 mb-4 flex-grow space-y-3">
                        {rec.description.split("\n").map((paragraph, i) => {
                          // Check if paragraph looks like a heading (ends with colon)
                          if (paragraph.trim().endsWith(":")) {
                            return (
                              <h4
                                key={i}
                                className="font-semibold text-gray-800 text-lg mt-4 first:mt-0"
                              >
                                {paragraph.replace(":", "")}
                              </h4>
                            );
                          }
                          // Check for bullet points
                          if (paragraph.trim().startsWith("*")) {
                            return (
                              <ul key={i} className="list-disc pl-5 space-y-1">
                                {paragraph
                                  .split("*")
                                  .filter((item) => item.trim())
                                  .map((item, j) => (
                                    <li key={j}>{item.trim()}</li>
                                  ))}
                              </ul>
                            );
                          }
                          // Regular paragraph
                          return <p key={i}>{paragraph}</p>;
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 ${
                                  i < Math.round(rec.match * 5)
                                    ? "fill-current"
                                    : "text-gray-300"
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-gray-500 text-sm">
                            ({Math.round(rec.match * 5000).toLocaleString()}{" "}
                            reviews)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {rec.price && (
                            <div className="text-lg font-bold text-gray-800">
                              ${rec.price.toFixed(2)}
                            </div>
                          )}
                          <motion.a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition duration-300 flex items-center gap-2"
                            whileHover={{
                              scale: 1.05,
                              boxShadow:
                                "0 10px 15px -3px rgba(99, 102, 241, 0.3)",
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            View Course
                          </motion.a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      {/* Chatbot Button */}

      <motion.div
        className="fixed bottom-8 right-8 z-50 group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: { delay: 1, type: "spring", stiffness: 300 },
        }}
        whileHover={{
          scale: 1.05,
          transition: { type: "spring", bounce: 0.5 },
        }}
      >
        <div className="relative">
          {/* Floating notification dot */}
          <motion.div
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs z-10 shadow-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            !
          </motion.div>

          {/* Main button with 3D effect */}
          <motion.button
            onClick={handleChatbotClick}
            className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-full text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            whileHover={{
              rotate: [0, 10, -10, 5, 0],
              scale: 1.1,
              transition: { duration: 0.5 },
            }}
            whileTap={{
              scale: 0.9,
              rotate: -5,
            }}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              },
            }}
          >
            {/* Animated robot face */}
            <motion.div
              className="flex flex-col items-center"
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                y: {
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 0.5,
                },
              }}
            >
              {/* Eyes that blink occasionally */}
              <motion.div
                className="flex space-x-1 mb-1"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  times: [0, 0.1, 1],
                  duration: 0.5,
                  delay: 5,
                  repeat: Infinity,
                  repeatDelay: 10,
                }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </motion.div>
              {/* Mouth that changes expression */}
              <motion.div
                className="w-6 h-1 bg-white rounded-full"
                animate={{
                  height: [1, 3, 1],
                  borderRadius: ["10px", "5px", "10px"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-400"
              initial={{ opacity: 0, scale: 1 }}
              animate={{
                opacity: [0, 0.3, 0],
                scale: [1, 1.5, 2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.button>

          {/* Interactive tooltip with typing indicator */}
          <div className="absolute bottom-full right-0 mb-3 w-56 bg-white text-gray-800 text-sm font-medium px-4 py-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="absolute bottom-0 right-4 w-3 h-3 bg-white transform rotate-45 -mb-1.5"></div>

            <div className="flex items-start">
              <div className="mr-2 text-lg">🤖</div>
              <div>
                <div className="text-indigo-600 font-bold mb-1">
                  Learning Assistant
                </div>
                <div className="flex items-center">
                  <span>Ready to help!</span>
                  <div className="ml-2 flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Speech bubble effect on click */}
          <AnimatePresence>
            {isClicked && (
              <motion.div
                className="absolute -top-20 right-0 bg-white px-4 py-2 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute bottom-0 right-4 w-3 h-3 bg-white transform rotate-45 -mb-1.5"></div>
                <div className="text-sm">Let's learn something new!</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Footer with enhanced design */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">📚</span> TelioLabs
              </h3>
              <p className="text-gray-400 mb-6">
                Empowering learners to find their path through personalized
                course recommendations.
              </p>
              <div className="flex space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map(
                  (social) => (
                    <a
                      key={social}
                      href={`#${social}`}
                      className="bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-600 transition duration-300"
                    >
                      <span className="text-lg">
                        {social === "twitter"
                          ? "𝕏"
                          : social === "facebook"
                          ? "f"
                          : social === "instagram"
                          ? "📷"
                          : "in"}
                      </span>
                    </a>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                {["How It Works", "Features", "Pricing", "FAQ"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="hover:text-indigo-400 transition duration-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                {[
                  "Learning Paths",
                  "Career Guides",
                  "Success Stories",
                  "Blog",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="hover:text-indigo-400 transition duration-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Subscribe</h4>
              <p className="text-gray-400 mb-4">
                Get weekly learning tips and course recommendations
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg focus:outline-none text-gray-800 flex-grow"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-r-lg transition duration-300"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 TelioLabs. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#privacy"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#terms"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Terms of Service
              </a>
              <a
                href="#cookies"
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
