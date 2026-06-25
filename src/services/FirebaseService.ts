import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

function cleanUndefined<O>(obj: O): O {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  const result: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      result[key] = cleanUndefined(val);
    }
  }
  return result;
}

export class FirebaseService<T extends { id: string; empresaId?: string }> {
  constructor(private collectionName: string) {}

  private getCollection() {
    return collection(db, this.collectionName);
  }

  async getAll(empresaId?: string): Promise<T[]> {
    const q = empresaId
      ? query(this.getCollection(), where('empresaId', '==', empresaId))
      : query(this.getCollection());
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async getPaginated(constraints: QueryConstraint[], empresaId?: string): Promise<{ data: T[]; lastDoc: DocumentData | null }> {
    const allConstraints = empresaId
      ? [where('empresaId', '==', empresaId), ...constraints]
      : constraints;
    const q = query(this.getCollection(), ...allConstraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { data, lastDoc };
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as T;
    }
    return null;
  }

  async create(data: Omit<T, 'id'>, customId?: string): Promise<T> {
    const colRef = this.getCollection();
    const docRef = customId ? doc(colRef, customId) : doc(colRef);
    const id = docRef.id;
    const docData = cleanUndefined({ ...data, createdAt: new Date().toISOString() });
    await setDoc(docRef, docData);
    return { id, ...data } as T;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const docData = cleanUndefined({ ...data, updatedAt: new Date().toISOString() });
    await updateDoc(docRef, docData as any);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Find generic Method
  async findByField(field: string, operator: any, value: any, empresaId?: string): Promise<T[]> {
    const constraints = [where(field, operator, value)];
    if (empresaId) {
      constraints.push(where('empresaId', '==', empresaId));
    }
    const q = query(this.getCollection(), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
}
