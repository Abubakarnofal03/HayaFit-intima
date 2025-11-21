import { useEffect } from "react";

const NotFound = () => {
  useEffect(() => {
    // Redirect to home page immediately
    window.location.href = "https://hayafitintima.store";
  }, []);

  return null;
};

export default NotFound;
