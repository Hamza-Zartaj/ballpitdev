import { useAuth } from "@/app/contexts/AuthProvider";
import { useEffect, useState } from "react";
import AIChatBubble from "./AIChatBubble";
import Modal from "../components/Modal";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/app/config/firebase";

const ChipItem = (props) => {
  const { active, children, onClick } = props;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border mr-3 mb-2
                  ${active
          ? "bg-Grey-800 text-Primary-500 border-Primary-500 transition-colors duration-200"
          : "bg-white text-gray-800 border-gray-200"
        }`}
    >
      <span>{children}</span>
    </button>
  );
};

const CONSTS = {
  PERSONALITY: {
    FRIENDLY: "friendly",
    PROFESSIONAL: "professional",
    CASUAL: "casual",
    ENERGIC: "energetic",
  },
};

const Tab1 = () => {
  const [images, setImages] = useState([]); // Change image to an array
  const [shareImage, setShareImage] = useState(false);
  const [personality, setPersonality] = useState("");
  const [personaName, setPersonaName] = useState("");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  // Single user type — all users have full persona access
  useEffect(() => {
    // No guest restrictions needed
  }, [user]);

  // Load initial config from database
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/users/persona?id=${user.uid}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = (await response.json()) || {};
        if (data) {
          setPersonaName(data.name || "");
          setPersonality(data.personality || "");
          setExtraPrompt(data.extraPrompt || "");
          setShareImage(data.shareImage || false);
          
          // Convert URL strings back to objects with type info
          // Since we only store URLs, default to 'image' type
          const loadedImages = (data.images || []).map(img => 
            typeof img === 'string' 
              ? { url: img, type: 'image' }  // Default to image
              : img  // Already in correct format
          );
          setImages(loadedImages);
        } else {
          setModalOpen(true);
        }
      } catch (err) {
        
      }
    };

    if (user?.uid) {
      loadConfig();
    }
  }, [user]);

  const savePersonaSettings = async (setting) => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const res = await fetch(`/api/users/persona?id=${user.uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setting),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3s
      }
    } catch (e) {
      
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!personality) {
      alert("Please select a personality");
      return;
    }
    const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);
    const personaSetting = {
      name: personaName,
      personality,
      extraPrompt,
      shareImage,
      images: imageUrls,
    };
    await savePersonaSettings(personaSetting);
  };

  const uploadToFirebase = async (file) => {
    try {
      const storageRef = ref(
        storage,
        `medias/${file.name}-${Math.round(Math.random() * 10000000)}`
      );
      const snapshot = await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (e) {
      console.error("Error uploading file:", e);
      throw e;
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const imagePromises = files.map(async (file) => {
      const mediaType = file.type.split("/")[0];
      const url = await uploadToFirebase(file);
      switch (mediaType) {
        case "video":
          return {
            type: "video",
            url,
          };
        case "image":
          return {
            type: "image",
            url,
          };
        default:
          return {};
      }
    });
    Promise.all(imagePromises).then((results) => {
      setImages((prevImages) => [...prevImages, ...results]);
    });
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="p-6 w-full overflow-y-auto">
        <p className="font-cabinet text-lg">Persona Name</p>
        <p className="text-gray-600 text-base">
          Set the name for your AI persona that will be used in conversations
        </p>
        <input
          type="text"
          value={personaName}
          onChange={(e) => setPersonaName(e.target.value)}
          placeholder="e.g., Sarah, Tech Support Team, Customer Service AI"
          className="mt-2 w-full px-6 py-2 h-14 rounded-full 
          border-[1px] border-Grey-600 
          hover:border-Primary-400 focus:border-Primary-400 focus:ring-2 focus:ring-Primary-200
          font-satoshi text-base text-grey-700
          bg-white transition-all duration-200 ease-in-out focus:outline-none"
        />
        <p className="font-cabinet text-lg mt-10">AI Personality</p>
        <p className="text-gray-600 text-base">
          Select the personality of your AI Persona
        </p>
        <div className="relative">
          <select
            className="mt-2 w-full px-6 py-2 h-16 rounded-full 
            border-[1px] border-Grey-600 
            hover:border-Primary-400 focus:border-Primary-400 focus:ring-2 focus:ring-Primary-200
            appearance-none cursor-pointer
            font-satoshi text-base text-Grey-600
            bg-white transition-all duration-200 ease-in-out"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          >
            <option value="" disabled hidden>
              Select Option
            </option>
            <option value={CONSTS.PERSONALITY.FRIENDLY}>
              Friendly & Helpful
            </option>
            <option value={CONSTS.PERSONALITY.PROFESSIONAL}>
              Professional & Formal
            </option>
            <option value={CONSTS.PERSONALITY.CASUAL}>Casual & Relaxed</option>
            <option value={CONSTS.PERSONALITY.ENERGIC}>
              Energetic & Enthusiastic
            </option>
          </select>
          <div className="absolute inset-y-0 right-6 mt-2 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-Grey-600 transition-colors duration-200"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <>
          <p className="font-cabinet text-lg mt-10">
            About Your Business
          </p>
          <p className="text-gray-600 text-base">
            Describe what your business offers and how you want the AI to represent you. The more detail you provide, the better the AI can help sell your products/services.
          </p>
          <div
            className={`w-full h-40 pr-1 pb-1 pl-2 pt-1.5 mt-2
                      border-[1.2px] rounded-2xl resize-none 
                      focus-within:border-purple-500 text-gray-700
                      focus:border-Primary-400 border-Grey-700`}
          >
            <textarea
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="E.g., 'I sell handmade jewelry. Focus on quality, customization, and fast shipping. Be enthusiastic about unique pieces.'"
              className="w-full h-full pr-1 pb-1 pl-2 pt-1.5 resize-none focus:outline-none text-gray-700"
            />
          </div>
        </>
        <>
          <div className="w-full flex justify-center items-center mt-10">
            <div>
              <p className="font-cabinet text-lg">
                Allow AI to Share Product Images & Videos
              </p>
              <p className="text-gray-600 text-base">
                Let the AI automatically share your product images and videos during conversations. This helps showcase your offerings and increase customer confidence
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer h-6">
              <input
                checked={shareImage}
                onChange={(e) => setShareImage(e.target.checked)}
                type="checkbox"
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                            after:bg-white after:border-gray-300 after:border after:rounded-full 
                            after:h-5 after:w-5 after:transition-all peer-checked:bg-[#65c466]"
              ></div>
            </label>
          </div>
          <div className="flex flex-col w-full mt-4">
            <div className="flex w-full items-center">
              <p className="font-cabinet text-lg">Product Gallery</p>
              <p className="text-[1rem] text-gray-600 ml-2">
                ({images.length} Uploaded)
              </p>
            </div>
            <p className="text-[1rem] text-gray-600">
              Upload product images and videos here. The AI will intelligently share these with customers during conversations to showcase your offerings.
            </p>
          </div>

          {/* <div className="flex flex-col items-center space-y-4 p-4"> */}
          <div className="grid grid-cols-2 gap-4 pl-2 mt-3">
            {images.map((image, index) => (
              <div key={index} className="relative">
                {image.type === "video" ? (
                  <>
                    <video
                      src={image.url}
                      autoPlay
                      alt={`Uploaded ${index}`}
                      className="w-48 h-48 object-cover rounded-[20px] shadow-md cursor-pointer "
                    />
                    <button
                      onClick={() => removeImage(index)} // Optional close icon for accessibility
                      className="absolute -top-2 right-3 w-7 h-7 border-[5px] border-white bg-black  rounded-full flex items-center justify-center text-white"
                    >
                      ×
                    </button>
                  </>
                ) : image.type === "image" ? (
                  <>
                    <img
                      src={image.url}
                      alt={`Uploaded ${index}`}
                      className="w-48 h-48 object-cover rounded-[20px] shadow-md cursor-pointer "
                    />
                    <button
                      onClick={() => removeImage(index)} // Optional close icon for accessibility
                      className="absolute -top-2 right-3 w-7 h-7 border-[5px] border-white bg-black  rounded-full flex items-center justify-center text-white"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <></>
                )}
              </div>
            ))}
          </div>
          <label
            className={`${images.length >= 4
              ? "pointer-events-none opacity-50 cursor-not-allowed"
              : "cursor-pointer"
              } w-full mt-2 py-3 px-4 rounded-full text-Primary-500 font-medium flex items-end justify-center items-center bg-Primary-800 hover:opacity-90`}
            htmlFor="file-input"
          >
            <img src="/assets/svgs/upload.svg" className="mr-2" />
            Upload Your Media
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*, video/*"
            className="hidden"
            onChange={handleImageChange}
            multiple // Allow multiple file selection
          />
        </>

        {/* Save Button */}
        <div className="flex flex-col gap-3 mt-10 pb-10">
          {saveSuccess && (
            <div className="w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-full text-center">
              ✓ Persona settings saved successfully!
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-14 rounded-full font-satoshi font-medium text-white transition-all duration-200 ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-Primary-500 hover:bg-Primary-600 active:scale-95"
            }`}
          >
            {isSaving ? "Saving..." : "Save Persona Settings"}
          </button>
        </div>
      </div>
      <Modal noCloseButton animationDuration={500} isOpen={modalOpen}>
        <div className="w-full px-6 pt-10">
          <p className="font-cabinet text-3xl">
            Identify messages by your AI persona
          </p>
          <p className="mt-2 font-satoshi text-lg text-Grey-500">
            Messages generated by AI will feature an AI icon next to the
            timestamp. Rest assured, only you will be able to see this icon,
            allowing you to easily identify which messages are AI-generated.
          </p>
          <div className="w-full mt-6 bg-Primary-800 rounded-[40px] p-6">
            <AIChatBubble
              className="mb-6"
              modal
              time={Date.now()}
              content="This is an AI message example"
            />
            <AIChatBubble
              isMe
              time={Date.now()}
              content="This is another AI-Generated message example"
            />
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="w-full mt-6 font-satoshi bg-Primary-500 text-white h-16 text-base rounded-full"
          >
            Continue
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Tab1;
