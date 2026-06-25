import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  empresaId: string;
  role: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: (selectedRole?: 'admin' | 'cliente') => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [role, setRole] = useState<string>(() => localStorage.getItem('session_role') || '');

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        let currentRole = localStorage.getItem('session_role');
        const pendingRole = localStorage.getItem('pending_auth_role') as 'admin' | 'cliente' | null;
        
        let roleToUse = currentRole;
        
        if (pendingRole) {
          localStorage.setItem('session_role', pendingRole);
          localStorage.removeItem('pending_auth_role');
          roleToUse = pendingRole;
        }
        
        if (active && roleToUse) {
          setRole(roleToUse);
        }

        try {
          const db = getFirestore(getApp());
          const userDocRef = doc(db, 'usuarios', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Check if user is trying to switch roles
            if (pendingRole && data.role && data.role !== pendingRole) {
              alert(`Acesso negado: Seu perfil atual é de ${data.role === 'admin' ? 'Dono de Adega' : 'Cliente'}. Não é possível acessar a plataforma com um perfil diferente do cadastrado.`);
              await signOut(auth);
              localStorage.removeItem('session_role');
              setUser(null);
              setRole('');
              setEmpresaId('');
              if (active) setLoading(false);
              return;
            }

            // Protect admin from accidental demotion to cliente during customer site visits
            let targetRole = roleToUse;
            if (data.role === 'admin') {
              targetRole = 'admin';
              roleToUse = 'admin';
              localStorage.setItem('session_role', 'admin');
            }

            if (!targetRole) {
              targetRole = data.role || 'cliente';
              roleToUse = targetRole;
              localStorage.setItem('session_role', targetRole);
            }
            
            if (data.role !== targetRole) {
              const emailPrefix = u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
              const genEmpresaId = targetRole === 'admin'
                ? (data.empresaId && data.empresaId !== 'customer' ? data.empresaId : (emailPrefix || 'empresa_' + u.uid.slice(0, 8)))
                : 'customer';
              
              await setDoc(userDocRef, { role: targetRole, empresaId: genEmpresaId }, { merge: true });
              data.role = targetRole;
              data.empresaId = genEmpresaId;
            }
            
            if (active) {
              const emailPrefix = u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
              const fallbackEmpId = 'emp_' + (emailPrefix || u.uid.slice(0, 8));
              setEmpresaId(data.empresaId || (roleToUse === 'admin' ? fallbackEmpId : 'customer'));
              setRole(roleToUse);
            }
          } else {
            const chosenRole = roleToUse || pendingRole || 'cliente';
            localStorage.setItem('session_role', chosenRole);
            localStorage.removeItem('pending_auth_role');
            
            const emailPrefix = u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
            const genEmpresaId = chosenRole === 'admin' 
              ? (emailPrefix || 'empresa_' + u.uid.slice(0, 8))
              : 'customer';
            
            const profile = {
              email: u.email || '',
              name: u.displayName || '',
              photoURL: u.photoURL || '',
              role: chosenRole,
              empresaId: genEmpresaId,
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userDocRef, profile);
            if (active) {
              setEmpresaId(genEmpresaId);
              setRole(chosenRole);
            }
          }
        } catch (e: any) {
          const isOffline = e?.message?.includes('offline') || e?.code === 'unavailable';
          if (isOffline) {
            console.warn("User profile loading: offline, using cached/local defaults.", e.message);
          } else {
            console.error("Error loading user profile:", e);
          }
          if (active) {
            const fallbackRole = localStorage.getItem('session_role') || localStorage.getItem('pending_auth_role') || 'cliente';
            const emailPrefix = u?.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
            const fallbackEmpId = 'emp_' + (emailPrefix || (u?.uid ? u.uid.slice(0, 8) : 'anon'));
            setEmpresaId(fallbackRole === 'admin' ? fallbackEmpId : 'customer');
            setRole(fallbackRole);
          }
        }
      } else {
        setUser(null);
        setEmpresaId('');
        setRole('');
      }
      if (active) {
        setLoading(false);
      }
    });
    
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    localStorage.setItem('pending_auth_role', 'admin'); // Email/pass defaults to admin panel login
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async (selectedRole: 'admin' | 'cliente' = 'cliente') => {
    localStorage.setItem('pending_auth_role', selectedRole);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = async () => {
    localStorage.removeItem('session_role');
    localStorage.removeItem('pending_auth_role');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, empresaId, role, signIn, signInWithGoogle, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
