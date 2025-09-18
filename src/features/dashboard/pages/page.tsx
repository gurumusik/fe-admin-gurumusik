import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard-admin/instrument", { replace: true });
  }, [navigate]);

  return null;
};
