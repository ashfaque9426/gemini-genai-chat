"use client"

import { AuthContext } from "@/providers/AuthProvider";
import { use } from "react";

function useAuth() {
  const auth = use(AuthContext);

  if (!auth) {
    throw new Error("useAuth must be called to the components wrapped in <AuthProvider>{children}</AuthProvider>");
  }

  return auth;
}

export default useAuth;