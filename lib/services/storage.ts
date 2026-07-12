import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase/client";

export async function uploadUserFile(userId: string, folder: string, file: File) {
  const path = `users/${userId}/${folder}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
