const Header = () => {
  return (
    <header className="relative z-10 bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm border-b border-gray-200 p-4 shadow-md">
      <div className="container mx-auto flex items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center overflow-hidden mr-3 relative">
            {/* Neural network animation */}
            <div className="absolute inset-0">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                {/* Nodes */}
                <circle
                  cx="20"
                  cy="10"
                  r="3"
                  className="fill-blue-100 animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <circle
                  cx="10"
                  cy="20"
                  r="3"
                  className="fill-blue-100 animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <circle
                  cx="30"
                  cy="20"
                  r="3"
                  className="fill-blue-100 animate-pulse"
                  style={{ animationDelay: "600ms" }}
                />
                <circle
                  cx="20"
                  cy="30"
                  r="3"
                  className="fill-blue-100 animate-pulse"
                  style={{ animationDelay: "900ms" }}
                />
                <circle
                  cx="20"
                  cy="20"
                  r="3"
                  className="fill-blue-100 animate-pulse"
                  style={{ animationDelay: "1200ms" }}
                />

                {/* Connections */}
                <line
                  x1="20"
                  y1="10"
                  x2="10"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1="10"
                  x2="30"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1="10"
                  x2="20"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="10"
                  y1="20"
                  x2="20"
                  y2="30"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="20"
                  x2="20"
                  y2="30"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="10"
                  y1="20"
                  x2="20"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="20"
                  x2="20"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1="30"
                  x2="20"
                  y2="20"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />

                {/* Data flow animation */}
                <circle cx="15" cy="15" r="1" className="fill-white">
                  <animateMotion
                    path="M 0 0 L 10 10 Z"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="25" cy="15" r="1" className="fill-white">
                  <animateMotion
                    path="M 0 0 L -10 10 Z"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="20" cy="15" r="1" className="fill-white">
                  <animateMotion
                    path="M 0 0 L 0 10 Z"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
          </div>
          <h1 className="text-gray-800 text-2xl font-bold tracking-wider">
            <span className="text-blue-500">Telio</span>Labs Demo
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
