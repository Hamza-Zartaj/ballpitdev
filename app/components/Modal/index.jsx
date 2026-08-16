"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Modal = ({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  animationDuration,
  noCloseButton
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      const timer = setTimeout(() => setShowModal(false), animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

  return (
    <>
      {showModal && (
        <div
          className={`fixed top-0 left-0 flex h-full w-full items-center justify-center z-50 transition-opacity duration-${animationDuration} ${isOpen ? "opacity-100" : "opacity-0"
            }`}
        >
          <div
            className={`relative overflow-hidden w-full h-full sm:h-[95vh] sm:rounded-3xl inset-0 z-50 flex items-end justify-center max-w-[528px]`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} // Dark overlay
          >
            <div
              className={`relative w-full max-w-xl p-6 bg-white rounded-t-[32px] shadow-lg transform transition-transform ${overlayClassName} duration-${animationDuration} ease-in-out ${isOpen ? "translate-y-0" : "translate-y-full"
                } ${className}`}
              style={{
                maxHeight: "50vh", // ✅ Limit modal height to 50% of viewport height
                overflowY: "auto", // ✅ Enable scrolling if content overflows
              }}
            >
              {noCloseButton !== true ? (
                <button
                  className="absolute text-[40px] top-0 right-[5px] mt-4 mr-4 text-gray-600 hover:text-gray-900"
                  onClick={onClose}
                >
                  &times;
                </button>
              ) : null}

              {children}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  noCloseButton: PropTypes.bool,
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  animationDuration: PropTypes.number,
};

Modal.defaultProps = {
  className: "",
  overlayClassName: "bg-black bg-opacity-50",
  animationDuration: 300,
};

export default Modal;
