import {} from "firebase/storage";
import { storage } from "@/app/config/firebase";

const uploadAndGetUrl = async (file, collection) => {
  const storageRef = storage.ref();
  const fileRef = storageRef.child(`${collection}/${file.name}`);
  await fileRef.put(file);
  return fileRef.getDownloadURL();
};

export { uploadAndGetUrl };
