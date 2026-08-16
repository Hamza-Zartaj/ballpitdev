import * as React from "react";
import Header from "../components/Header";
import PrivacyContent from "./PrivacyContent";

function PrivacyLayout() {
  return (
    <div className="flex overflow-hidden animate-slide-in-right relative flex-col mx-auto w-full bg-white">
      <Header text="Terms and Conditions" />
      <PrivacyContent />
    </div>
  );
}

export default PrivacyLayout;