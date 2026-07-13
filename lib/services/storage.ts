import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { getFirebaseStorage } from "@/lib/firebase/client";

export async function uploadUserFile(userId: string, folder: string, file: File) {
  const path = `users/${userId}/${folder}/${Date.now()}-${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
