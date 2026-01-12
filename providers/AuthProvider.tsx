
"use client"
import auth from '@/lib/firebase';
import { loginStatusLsStr, lsUserInfoStr } from '@/utils/constants/constants';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, UserCredential } from 'firebase/auth';
import { createContext, ReactNode, useEffect, useState } from 'react';

interface AuthContextValues {
    contextLoading: boolean,
    setContextLoading: (value: boolean) => void,
    userInfo: UserInfoData | null,
    setUserInfo: (info: UserInfoData) => void,
    accessSecret: string | null,
    googlePopup: () => Promise<UserCredential>,
    logOut: () => Promise<void>,
    setAccessSecret: (value: string) => void
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

    const logOut = async () => {
        try {
            await signOut(auth);
            setContextLoading(true);
            setAccessSecret(null);
            setUserInfo(null);
            localStorage.setItem(loginStatusLsStr, "loggedOut");
            localStorage.removeItem(lsUserInfoStr);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "error occurred during user logout";
            console.log(errMsg);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const logInStatus = localStorage.getItem('GenAiLoginStatus');
            try {
                if (currentUser?.uid) {
                    let token;
                    if (logInStatus && logInStatus === "loggedIn") {
                        // refresh access token
                        token = "";
                    } else {
                        // request for refresh-token/access-token
                        token = "";
                    }
                    
                    // get the refresh token in browser http cookie and the access token in the cookie storage.
                    if (token) setAccessSecret(token);
                    const userInfo = {
                        uid: currentUser.uid,
                        userName: currentUser.displayName || "Anonymous",
                        userEmail: currentUser.email,
                        photoURL: currentUser.photoURL
                    }
                    setUserInfo(userInfo);
                    localStorage.setItem(loginStatusLsStr, "loggedIn");
                    localStorage.setItem(lsUserInfoStr, JSON.stringify({ uid: currentUser.uid, userEmail: currentUser.email }));
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
        <AuthContext value={{ contextLoading, setContextLoading, userInfo, setUserInfo, accessSecret, googlePopup, logOut, setAccessSecret }}>{children}</AuthContext>
    )
}

export { AuthContext, AuthProvider };;