import React from "react";
import "./App.css";
import Camera from "./components/Camera.tsx";

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="mt-2 pb-[4%]">
        <img
          src="./assets/sitelogo.png"
          //src="birthday-photobooth/assets/sitelogo.png"
          alt="Site Logo"
          className="h-[10%] sm:h-[15%] md:h-[20%] lg:h-[25%] max-w-[90%] w-auto"
        />
      </div>

      {/* Camera Component */}
      <div className="flex flex-col justify-center items-center w-full pb-[14%]">
        <Camera />
      </div>
    </div>
  );
};

export default App;
