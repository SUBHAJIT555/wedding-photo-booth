import { useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const AnimatedButton = ({
  text = "Button",
  to = null,
  className = "",
  onClick = null,
  size = "default", // "small", "default", "large"
}) => {
  const buttonRef = useRef(null);

  const createRipple = (event) => {
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      z-index: 1;
    `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleTouchStart = (event) => {
    createRipple(event.touches[0]);
  };

  const handleMouseDown = (event) => {
    createRipple(event);
  };

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      padding: "px-6 py-2",
      textSize: "text-lg",
      minHeight: "min-h-[40px]",
      minWidth: "min-w-[120px]",
    },
    default: {
      padding: "px-[13vw] py-4",
      textSize: "text-[4vw]",
      minHeight: "min-h-[60px]",
      minWidth: "min-w-[200px]",
    },
    large: {
      padding: "px-16 py-6",
      textSize: "text-2xl",
      minHeight: "min-h-[80px]",
      minWidth: "min-w-[250px]",
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.default;

  const buttonElement = (
    <button
      ref={buttonRef}
      className={`
        relative ${currentSize.padding} z-[2] font-light tracking-tight capitalize 
        border-2 border-[#FF5900] rounded-full text-white 
        bg-[#FF5900] 
        transition-all duration-300 overflow-hidden
        shadow-[0_0_20px_rgba(255,89,0,0.6)] 
        hover:bg-[#e04d00] hover:shadow-[0_0_35px_rgba(255,89,0,0.8)]
        active:scale-[0.98] active:shadow-[0_0_25px_rgba(255,89,0,0.9)]
        touch-manipulation select-none ${currentSize.minHeight} ${currentSize.minWidth}
        ${className}
      `}
      style={{ touchAction: "manipulation" }}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Professional Shimmer Effect */}
      <div className="overflow-hidden absolute inset-0">
        <div className="shimmer-wrapper absolute w-[200%] h-full transform -translate-x-full">
          <div className="absolute w-1/2 h-full bg-gradient-to-r from-transparent to-transparent shimmer via-white/20"></div>
        </div>
      </div>

      {/* Subtle Particle Effects */}
      <div className="overflow-hidden absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full particle bg-white/40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float-particle ${
                Math.random() * 3 + 2
              }s linear infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Professional Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr rounded-xl from-[#FF5900]/20 via-[#e04d00]/10 to-[#FF5900]/20"></div>

      {/* Button Text with Professional Shadow */}
      <span
        className={`
        relative ${currentSize.textSize} font-golonto uppercase tracking-widest font-extrabold z-10 
        transition-transform duration-200 
        text-white
        drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]
      `}
      >
        {text}
      </span>

      {/* Inline Styles for Animations */}
      <style>
        {`
          @keyframes float-particle {
            0% {
              transform: translateY(0) scale(1);
              opacity: 0;
            }
            50% {
              transform: translateY(-20px) scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: translateY(-40px) scale(0.8);
              opacity: 0;
            }
          }

          .shimmer-wrapper {
            animation: shimmer 3s infinite;
          }

          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 0.7;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }

          /* Enhanced touch feedback */
          @media (hover: none) and (pointer: coarse) {
            button:active {
              transform: scale(0.98);
              background: #e04d00;
            }
          }

          /* Professional button state transitions */
          button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          button:active {
            transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
    </button>
  );

  // If 'to' prop is provided, wrap with Link, otherwise return button directly
  if (to && to !== null) {
    return <Link to={to}>{buttonElement}</Link>;
  }

  return buttonElement;
};

AnimatedButton.propTypes = {
  text: PropTypes.string,
  to: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(["small", "default", "large"]),
};

export default AnimatedButton;
