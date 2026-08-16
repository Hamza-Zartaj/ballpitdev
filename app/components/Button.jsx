/**
 * @props disabled, type, onClick
 * @type primary, secondary, soft, custom
 * Use this globally, and create an issue when an update needed.
 */

const Button = ({
  children,
  type = "primary",
  large = false,
  full = false,
  className = "",
  disabled,
  isLoading = false, // Add loading prop
  ...props
}) => {
  const spinClassName = () => {
    switch (type) {
      case "primary":
        return "border-white";
      case "secondary":
        return "border-black";
      case "soft":
        return "border-Primary-500";
      case "custom":
      // return "border-white";
      default:
        return "border-black";
    }
  };
  return (
    <button
      disabled={isLoading || disabled} // Disable button when loading
      className={
        disabled
          ? `${full ? "w-full" : ""} ${large ? "py-5 px-6" : "py-3 px-4"} 
             rounded-full font-medium flex items-center justify-center 
             ${type === "primary" ? "bg-Primary-500 opacity-75 text-white" : ""}
             ${type === "secondary" ? "bg-Grey-800 opacity-75" : ""}
             ${
               type === "soft"
                 ? "bg-Primary-800 text-Primary-500 opacity-75"
                 : ""
             } 
             ${className} cursor-not-allowed`
          : `${full ? "w-full" : ""} ${large ? "py-5 px-6" : "py-3 px-4"} 
             rounded-full font-medium flex items-center justify-center 
             ${
               type === "primary"
                 ? "bg-Primary-500 hover:opacity-90 text-white"
                 : ""
             }
             ${type === "secondary" ? "bg-Grey-800 hover:opacity-90" : ""}
             ${
               type === "soft"
                 ? "bg-Primary-800 text-Primary-500 hover:opacity-90"
                 : ""
             } 
             ${className} cursor-pointer`
      }
      {...props}
    >
      {isLoading ? (
        <div className="mr-2">
          <div
            className={`w-5 h-5 border-2 ${spinClassName()} border-t-transparent rounded-full animate-spin`}
          ></div>
        </div>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
