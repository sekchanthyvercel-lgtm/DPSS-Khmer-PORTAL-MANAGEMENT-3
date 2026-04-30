import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth'; 
import { AppData, BackupEntry, DEFAULT_COLUMNS } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Initialization ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const DOC_PATH = 'portal/data';

// Auto-Authenticate
signInAnonymously(auth).catch(err => handleFirestoreError(err, OperationType.WRITE, 'Auth'));

// Connection Test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('permission-denied')) {
        // Expected if rules are default-deny, maybe this is not the right test for connectivity?
        // Actually, the firebase instructions mandate this.
    }
  }
}
testConnection();

// --- Data Operations ---

export const subscribeToData = (
  onData: (data: AppData) => void,
  onError: (error: any) => void
) => {
  const docRef = doc(db, DOC_PATH);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as AppData;
      onData({
        ...data,
        students: data.students || [],
        attendance: data.attendance || {},
        systemLocked: data.systemLocked || false
      });
    } else {
      const initialData: AppData = { 
        students: [], 
        settings: { fontSize: 12, fontFamily: "'Inter', sans-serif", columns: DEFAULT_COLUMNS, backgroundImage: '' },
        attendance: {},
        moduleLocks: {},
        staffDirectory: {},
        systemLocked: false,
        updatedAt: serverTimestamp() as any
      };
      setDoc(docRef, initialData).catch(err => handleFirestoreError(err, OperationType.CREATE, DOC_PATH));
      onData(initialData);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, DOC_PATH);
    onError(error);
  });

  return unsubscribe;
};

export const saveData = async (data: AppData) => {
  const docRef = doc(db, DOC_PATH);
  try {
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DOC_PATH);
  }
};

export const createCloudBackup = async (data: AppData, type: 'Auto' | 'Manual' = 'Manual') => {
  const historyKey = 'dps_backups_local';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.unshift({
    timestamp: new Date().toISOString(),
    data: data,
    type: type,
    id: Math.random().toString(36).substr(2, 9)
  });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
};

export const getCloudBackups = async (): Promise<Partial<BackupEntry>[]> => {
  const historyKey = 'dps_backups_local';
  return JSON.parse(localStorage.getItem(historyKey) || '[]');
};

export const getSyncStatus = () => auth.currentUser !== null;
