import { useAppSession } from "@/lib/useAppSession";
import { useRespok } from "./context";

/**
 * Sign-in state from the app (cross-domain session check), the same contract the
 * Persian header uses. Any failure or missing URL means "logged out".
 */
export function useRespokAuth() {
  const { settings } = useRespok();
  const auth = settings.auth;
  const session = useAppSession(auth.sessionCheckUrl, auth.logoutUrl);
  const isLoggedIn = auth.enabled && session.status === "loggedIn" && session.user !== null;
  const fullName = session.user?.fullName?.trim();
  return {
    enabled: auth.enabled,
    isLoggedIn,
    /** Never shows the e-mail address in place of a name. */
    welcome: fullName ? `Welcome, ${fullName}` : "Welcome",
    loginUrl: auth.enabled && !isLoggedIn ? auth.loginUrl : "",
    /** Header sign-up button; hidden when signed in or not configured. */
    signupUrl: auth.enabled && !isLoggedIn ? auth.signupUrl : "",
    panelUrl: isLoggedIn ? auth.panelUrl : "",
    /** Target of every "Start free" call to action on the pages. */
    ctaUrl: auth.signupUrl || "/contact",
    logout: () => {
      void session.logout();
    },
    labels: {
      login: "Log in",
      signup: "Start free",
      panel: "Dashboard",
      logout: "Log out",
    },
  };
}
