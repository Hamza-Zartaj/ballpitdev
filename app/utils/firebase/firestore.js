import { doc, getDoc, query, where, getDocs, collection, setDoc } from "firebase/firestore";
import {firestore} from '@/app/config/firebase'

const getById = async (collectionName, docId) => {
  const collectionRef = collection(firestore, collectionName)
  const docRef = doc(collectionRef, docId);
  const _doc = await getDoc(docRef);
  return _doc.data();
};

const getByField = async (collectionName, field, value) => {
  const q = query(collectionName, where(field, "==", value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
};

const insertOne = async (collectionName, data) => {
  const docRef = await addDoc(collectionName, data);
  return docRef.id;
};

const updateOne = async (collectionName, docId, data) => {
  const collectionRef = collection(firestore, collectionName)
  const docRef = doc(collectionRef, docId);
  await setDoc(docRef, data, {merge: true});
};

export { getById, getByField, insertOne, updateOne };
