import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

const app = getApps().length ? getApp() : initializeApp(environment.firebase);
export const db = getFirestore(app);
export const auth = getAuth(app);
