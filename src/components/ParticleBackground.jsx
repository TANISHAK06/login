// ParticleBackground.jsx
import React, { useState, useEffect } from "react";

const ParticleBackground = () => {
  const [particles, setParticles] = useState([]);

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

  return (
    <>
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
    </>
  );
};

export default ParticleBackground;
