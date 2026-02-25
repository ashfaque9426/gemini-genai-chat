
"use client"
import { clearRFSHToken, issueUserSecret, refreshAccessToken } from '@/lib/api/auth.api';
import { saveUser } from '@/lib/api/user.api';
import auth from '@/lib/firebase';
import { GoogleImageUrl } from '@/models/User';
import { loginStatusLsStr, lsUserInfoStr } from '@/utils/constants/constants';
import { showToastMsg } from '@/utils/utilityFunc/utilityFunc';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, UserCredential } from 'firebase/auth';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { ToastContainer, Bounce } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

interface AuthContextValues {
    contextLoading: boolean,
    setContextLoading: React.Dispatch<React.SetStateAction<boolean>>;
    showSidebar: boolean;
    setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    userInfo: UserInfoData | null;
    setUserInfo: React.Dispatch<React.SetStateAction<UserInfoData | null>>;
    accessSecret: string | null;
    generatingConvIds: string[];
    setgeneratingConvIds: React.Dispatch<React.SetStateAction<string[]>>;
    convStorage: StoredConvs[];
    setConvStorage: React.Dispatch<React.SetStateAction<StoredConvs[]>>;
    userPromptArr: UserPrompt[];
    setUserPromptArr: React.Dispatch<React.SetStateAction<UserPrompt[]>>;
    convId: ConvIdObj;
    setConvId: (conValue: string, rsValue?: boolean) => void;
    googlePopup: () => Promise<UserCredential>;
    setPerfLogOut: React.Dispatch<React.SetStateAction<boolean>>;
    setAccessSecret: React.Dispatch<React.SetStateAction<string | null>>;
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

interface ConvIdObj {
    conversationId: string | null;
    reloadSession: boolean;
}

export interface Chats {
    _id: string;
    role: "user" | "assistant";
    content: string;
}

export interface StoredConvs {
    convId: string;
    chats: Chats[];
}

export interface UserPrompt {
    convId: string;
    userPrompt: string;
}

const AuthContext = createContext<AuthContextValues | null>(null);
const googleAuthProvider = new GoogleAuthProvider();

googleAuthProvider.setCustomParameters({
    prompt: "select_account",
});

function AuthProvider({ children }: { children: ReactNode }) {
    const [contextLoading, setContextLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
    const [convId, _setConvId] = useState<ConvIdObj>({ conversationId: null, reloadSession: false });
    const [generatingConvIds, setgeneratingConvIds] = useState<string[]>([]);
    const [convStorage, setConvStorage] = useState<StoredConvs[]>([]);
    const [userPromptArr, setUserPromptArr] = useState<UserPrompt[]>([]);

    const setConvId = (conValue: string, rsValue: boolean = false) => {
        _setConvId({ conversationId: conValue, reloadSession: rsValue });
    };
    
    const [accessSecret, setAccessSecret] = useState<string | null>(null);
    const [perfLogOut, setPerfLogOut] = useState(false);

    const googlePopup = () => {
        setContextLoading(true);
        return signInWithPopup(auth, googleAuthProvider);
    }

    const logOut = useCallback(async () => {
        try {
            await signOut(auth);
            setAccessSecret(null);
            await clearRFSHToken(userInfo);
            setUserInfo(null);
            _setConvId({ conversationId: null, reloadSession: false });
            setgeneratingConvIds([]);
            setConvStorage([]);
            setUserPromptArr([]);
            localStorage.setItem(loginStatusLsStr, "loggedOut");
            localStorage.removeItem(lsUserInfoStr);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "error occurred during user logout";
            console.log(errMsg);
        }
    }, [userInfo]);

    useEffect(()=> {
        const performLogOut = async () => {
            await logOut();
            setPerfLogOut(false);
        }
        
        if (perfLogOut) {
            performLogOut();
        }
    }, [perfLogOut, logOut]);

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
                    let tokenExpiration;
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
                        await refreshAccessToken().then(({ AccToken, expiresAt, paymentTire, paymentExp, message }) => {
                            if (message) throw new Error(message);
                            if (AccToken) {
                                token = AccToken;
                                tokenExpiration = expiresAt;
                                userPaymentTire = paymentTire;
                                userPaymentExp = paymentExp;
                            }
                        }).catch((message) => {
                            if (message.includes('No') || message.includes('Invalid') || message.includes('Refresh Token expired')) {
                                setPerfLogOut(true);
                            }
                            console.error(message);
                        });
                    } else {
                        await issueUserSecret(idToken, userInfo.userEmail).then(({ AccToken, expiresAt, paymentTire, paymentExp, message }) => {
                            if (message) throw new Error(message);
                            if (AccToken) {
                                token = AccToken;
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
                    setConvStorage(prev => prev.filter(conv => conv.convId !== "logOutChat"));
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
        <AuthContext value={{ contextLoading, setContextLoading, showSidebar, setShowSidebar, userInfo, setUserInfo, convId, setConvId, convStorage, setConvStorage, generatingConvIds, setgeneratingConvIds, userPromptArr, setUserPromptArr, accessSecret, googlePopup, setPerfLogOut, setAccessSecret }}>
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