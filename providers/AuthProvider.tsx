
"use client"
import { clearRFSHToken, issueUserSecret, refreshAccessToken } from '@/lib/api/auth.api';
import { saveUser } from '@/lib/api/user.api';
import auth from '@/lib/firebase';
import { GoogleImageUrl } from '@/models/User';
import { loginStatusLsStr, lsUserInfoStr } from '@/utils/constants/constants';
import { showToastMsg } from '@/utils/utilityFunc/utilityFunc';
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
    photoURL: GoogleImageUrl;
    sessionType: string;
    paymentTire: string | null;
    paymentExp: number | null;
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
            await clearRFSHToken(userInfo);
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
                    const userInfo = {
                        uid: currentUser.uid,
                        userName: currentUser.displayName || "Anonymous",
                        userEmail: currentUser.email,
                        photoURL: currentUser.photoURL as GoogleImageUrl,
                        sessionType: 'googleSignIn',
                    }

                    let token;
                    let tokenExpiration: number | null = 0;
                    const { creationTime, lastSignInTime } = currentUser.metadata;

                    const isFirstLogin = creationTime === lastSignInTime;

                    if (isFirstLogin && !storedUserInfo) {
                        showToastMsg('info', "Please wait until user profile creation process in done in DB");
                        const message = await saveUser(idToken, userInfo);
                        if (message.includes("successfully")) {
                            showToastMsg('success', message);
                        } else {
                            console.error(message);
                        }
                    }

                    let userPaymentTire = null;
                    let userPaymentExp = null;

                    if (logInStatus && logInStatus === "loggedIn") {
                        await refreshAccessToken().then(({ token, expiresAt, paymentTire, paymentExp, message }) => {
                            if (message) throw new Error(message);
                            if (token) {
                                token = token;
                                tokenExpiration = expiresAt;
                                userPaymentTire = paymentTire;
                                userPaymentExp = paymentExp;
                            }
                        }).catch((message) => console.error(message));
                    } else {
                        await issueUserSecret(idToken, userInfo.userEmail).then(({ token, expiresAt, paymentTire, paymentExp, message }) => {
                            if (message) throw new Error(message);
                            if (token) {
                                token = token;
                                tokenExpiration = expiresAt;
                                userPaymentTire = paymentTire;
                                userPaymentExp = paymentExp;
                            }
                        }).catch((message) => console.error(message));
                    }

                    if (token) setAccessSecret(token);
                    setUserInfo({
                        ...userInfo,
                        paymentTire: userPaymentTire,
                        paymentExp: userPaymentExp
                    });
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