import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export async function saveTenderAnalysis(userId: string, data: object): Promise<string> {
  const tendersRef = collection(db, 'tenders');
  const docRef = await addDoc(tendersRef, {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
    status: 'active',
  });
  return docRef.id;
}

export async function getTendersByUser(userId: string): Promise<any[]> {
  const tendersRef = collection(db, 'tenders');
  const q = query(
    tendersRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const tenders: any[] = [];
  querySnapshot.forEach((docSnap) => {
    tenders.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return tenders;
}

/**
 * Store the person behind the account (name + email), owner-scoped.
 * merge:true so a re-register or profile edit never wipes existing fields.
 */
export async function saveUserRecord(userId: string, name: string, email: string): Promise<void> {
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    { userId, name, email, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function saveBidderProfile(userId: string, profile: object): Promise<void> {
  const profileRef = doc(db, 'bidderProfiles', userId);
  await setDoc(profileRef, {
    ...profile,
    userId,
    updatedAt: new Date().toISOString(),
  });
}

export async function getBidderProfile(userId: string): Promise<any | null> {
  const profileRef = doc(db, 'bidderProfiles', userId);
  const docSnap = await getDoc(profileRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  }

  return null;
}

export async function createCompany(userId: string, profileData: object): Promise<string> {
  const companiesRef = collection(db, 'companies');
  const docRef = await addDoc(companiesRef, {
    ...profileData,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getCompaniesByUser(userId: string): Promise<any[]> {
  const companiesRef = collection(db, 'companies');
  const q = query(
    companiesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const companies: any[] = [];
  querySnapshot.forEach((docSnap) => {
    companies.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return companies;
}

export async function updateCompany(
  companyId: string,
  userId: string,
  profileData: object
): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await setDoc(companyRef, {
    ...profileData,
    userId,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCompany(companyId: string): Promise<void> {
  // Firestore rules restrict deletion to the document owner (userId == auth.uid).
  const companyRef = doc(db, 'companies', companyId);
  await deleteDoc(companyRef);
}

export async function saveTenderToCompany(
  userId: string,
  companyId: string,
  data: object
): Promise<string> {
  const tendersRef = collection(db, 'tenders');
  const docRef = await addDoc(tendersRef, {
    ...data,
    userId,
    companyId,
    createdAt: new Date().toISOString(),
    status: 'active',
  });
  return docRef.id;
}

export async function getTendersByCompany(
  userId: string,
  companyId: string
): Promise<any[]> {
  const tendersRef = collection(db, 'tenders');
  const q = query(
    tendersRef,
    where('userId', '==', userId),
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const tenders: any[] = [];
  querySnapshot.forEach((docSnap) => {
    tenders.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return tenders;
}
