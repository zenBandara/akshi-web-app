import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import LogoutIcon from "@mui/icons-material/Logout";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, useLocation } from "react-router-dom";
import Lesson from "./lesson";
import Analytics from "./analytics";
import akshiLogo from "./assets/akshi_logo.png";

const NAVIGATION = [
  {
    segment: "",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "lesson",
    title: "Lesson",
    icon: <SchoolIcon />,
  },
  {
    segment: "analytics",
    title: "Student Analytics",
    icon: <AnalyticsIcon />,
  },
];

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
});

function PageContent() {
  const location = useLocation();

  if (location.pathname === "/dashboard/lesson") {
    return <Lesson />;
  }else if (location.pathname ==="/dashboard/analytics"){
    return <Analytics />;
  }


  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Dashboard</Typography>
      <Typography variant="body1">
        Welcome to Akshi Teacher Control Panel.
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  return (
    <AppProvider
      navigation={NAVIGATION}
      branding={{
        title: "Teachers' Dashboard",
        logo: (
          <img
            src={akshiLogo}
            alt="Akshi Logo"
            style={{ height: 40 }}
          />
        ),
      }}
      router={{
        pathname: location.pathname.startsWith("/dashboard/")
          ? location.pathname.replace("/dashboard/", "")
          : "",
        navigate: (segment) => navigate(`/dashboard/${segment}`),
      }}
      theme={theme}
    >
      <DashboardLayout
        slots={{
          toolbarActions: () => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2">
                {user?.email}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          ),
        }}
      >
        <PageContent />
      </DashboardLayout>
    </AppProvider>
  );
}