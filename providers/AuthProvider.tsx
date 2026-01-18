
"use client"
// import { saveUser } from '@/lib/api/user.api';
import auth from '@/lib/firebase';
import { ACCESS_TOKEN_TTL_MS, loginStatusLsStr, lsUserInfoStr } from '@/utils/constants/constants';
import { isAccessTokenValid } from '@/utils/utilityFunc/utilityFunc';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, UserCredential } from 'firebase/auth';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { ToastContainer, Bounce } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

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
    sessionType: string;
}

const AuthContext = createContext<AuthContextValues | null>(null);
const googleAuthProvider = new GoogleAuthProvider();

googleAuthProvider.setCustomParameters({
    prompt: "select_account",
});

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
            const logInStatus = localStorage.getItem(loginStatusLsStr);
            const storedUserInfo = localStorage.getItem(lsUserInfoStr);
            try {
                if (currentUser?.uid) {
                    const idToken = await currentUser.getIdToken(true);
                    console.log(idToken);
                    const userInfo = {
                        uid: currentUser.uid,
                        userName: currentUser.displayName || "Anonymous",
                        userEmail: currentUser.email,
                        photoURL: currentUser.photoURL,
                        sessionType: 'googleSignIn',
                    }

                    let token;
                    let tokenExpiration = 0;
                    const { creationTime, lastSignInTime } = currentUser.metadata;

                    const isFirstLogin = creationTime === lastSignInTime;

                    if (isFirstLogin && !storedUserInfo) {
                        console.log("first time logged in triggered.");
                        // idToken required here
                        // save the user if only it's user's first time login(requires userInfo object)
                        // const message = await saveUser(idToken, userInfo);
                        // console.log(message);
                    }

                    if (logInStatus && logInStatus === "loggedIn") {
                        const hasValidAccessToken = isAccessTokenValid();
                        if (!hasValidAccessToken) {
                            // refresh access token(requires userEmail)
                            console.log("local storage logged in status triggered.");
                            token = "";
                            tokenExpiration = Date.now() + ACCESS_TOKEN_TTL_MS;
                        }
                    } else {
                        console.log("Not local storage logged in status triggered.");
                        // request for refresh-token/access-token(requires idToken, userEmail)
                        token = "";
                        tokenExpiration = Date.now() + ACCESS_TOKEN_TTL_MS;
                    }

                    // get the refresh token in browser http cookie and the access token in the cookie storage.
                    if (token) setAccessSecret(token);
                    setUserInfo(userInfo);
                    localStorage.setItem(loginStatusLsStr, "loggedIn");
                    localStorage.setItem(lsUserInfoStr, JSON.stringify({ userEmail: currentUser.email, expiresAt: tokenExpiration }));
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
        <AuthContext value={{ contextLoading, setContextLoading, userInfo, setUserInfo, accessSecret, googlePopup, logOut, setAccessSecret }}>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Bounce}
            />
        </AuthContext>
    )
}

export { AuthContext, AuthProvider };;