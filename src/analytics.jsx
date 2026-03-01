import React from "react";
import { Box, Typography } from "@mui/material";

export default function Analytics() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Page
      </Typography>

      <Typography variant="body1">
        This is the Analytics page. Navigation is working correctly.
      </Typography>
    </Box>
  );
}