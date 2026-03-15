import * as React from "react";
import { AppProvider } from "@toolpad/core";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useTheme } from "@mui/material/styles";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./dashboard";
import { colors } from "@mui/material";
import akshiLogo from "./assets/akshi_logo.png";

const providers = [{ id: "credentials", name: "Email and password" }];

const BRANDING = {
  title: "Akshi Teachers' Dashboard",
  logo: (
    <img
      src={akshiLogo}
      alt="Akshi Logo"
      style={{ height: 70 }}
    />

  ),
};

function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const signIn = async (provider, formData) => {
    const email = formData?.get("email");
    const password = formData?.get("password");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
      return { type: "CredentialsSignin" };
    } catch (error) {
      return {
        type: "CredentialsSignin",
        error: "Invalid email or password.",
      };
    }
  };

  return (
    <AppProvider theme={theme} branding={BRANDING}>
      <SignInPage
        signIn={signIn}
        providers={providers}
        slotProps={{
          emailField: { autoFocus: true },
          form: { noValidate: true },
        }}
      />
    </AppProvider>
  );
}

function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // While checking authentication state
  if (user === undefined) {
    return null;
  }

  // If not logged in → redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If authenticated → allow dashboard
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}