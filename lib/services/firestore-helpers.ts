import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";

function fromSnap<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export async function getOne<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const ref = doc(getFirebaseDb(), collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function getMany<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(getFirebaseDb(), collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromSnap<T>(d));
}

export function subscribeMany<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(getFirebaseDb(), collectionName), ...constraints);
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => fromSnap<T>(d))),
    onError
  );
}

export async function createDoc(
  collectionName: string,
  id: string,
  data: DocumentData
) {
  await setDoc(doc(getFirebaseDb(), collectionName, id), data);
}

export async function updateDocById(
  collectionName: string,
  id: string,
  data: DocumentData
) {
  await updateDoc(doc(getFirebaseDb(), collectionName, id), data);
}

export async function deleteDocById(collectionName: string, id: string) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, id));
}
