
"use client"
import auth from '@/lib/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, UserCredential } from 'firebase/auth';
import { createContext, ReactNode, useEffect, useState } from 'react';

interface AuthContextValues {
    contextLoading: boolean,
    setContextLoading: (value: boolean) => void,
    userInfo: UserInfoData | null,
    setUserInfo: (info: UserInfoData) => void,
    accessSecret: string | null,
    setAccessSecret: (value: string) => void,
    googlePopup: () => Promise<UserCredential>,
}

export interface UserInfoData {
    uid: string;
    userName: string | null;
    userEmail: string | null;
    photoURL: string | null;
}

const AuthContext = createContext<AuthContextValues | null>(null);
const googleAuthProvider = new GoogleAuthProvider();

function AuthProvider({ children }: { children: ReactNode }) {
    const [contextLoading, setContextLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
    const [accessSecret, setAccessSecret] = useState<string | null>(null);

    const googlePopup = () => {
        setContextLoading(true);
        return signInWithPopup(auth, googleAuthProvider);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser?.uid) {
                    // axios request
                    // request for refresh-token/access-token(with expiry period)
                    // get the refresh token in browser http cookie and the access token in the cookie storage.
                    const userInfo = {
                        uid: currentUser.uid,
                        userName: currentUser.displayName || "Anonymous",
                        userEmail: currentUser.email,
                        photoURL: currentUser.photoURL
                    }
                    setUserInfo(userInfo);
                }
            }
            catch (err) {
                console.error("Auth token retrieval failed:", err);
            }
            finally {
                setContextLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext value={{ contextLoading, setContextLoading, userInfo, setUserInfo, accessSecret, setAccessSecret, googlePopup }}>{children}</AuthContext>
    )
}

export { AuthContext, AuthProvider };;