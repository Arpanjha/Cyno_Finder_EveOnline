// constants/styles.js
// Updated styles for PushX Hauler Tool with enhanced aesthetics
export const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0e1a2b",
    backgroundImage: "linear-gradient(180deg, #001f3f 0%, #0e1a2b 100%)",
    color: "#ffffff",
    fontFamily: "Orbitron, sans-serif",
    display: "flex",
    flexDirection: "column",
    zIndex: 1, // Ensure it stays below header elements
    backgroundSize: "cover",
    overflow: "hidden",
  },
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    zIndex: 100, // Ensure it stays above other elements
    backgroundColor: "rgba(14, 26, 43, 0.8)", // Semi-transparent for visibility
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow
  },
  
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#00BFFF",
    textShadow: "0px 2px 15px rgba(0, 191, 255, 0.8)",
  },

  dropdown: {
    position: "relative",
    zIndex: 101, // Ensure dropdown is above other elements
  },
  
  searchWrapper: {
    marginTop: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  input: {
    width: "100%",
    maxWidth: "400px",
    padding: "0.5rem",
    border: "2px solid #00d8ff",
    borderRadius: "4px",
    backgroundColor: "#0e1a2b",
    color: "#ffffff",
    marginBottom: "1rem",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#00d8ff",
    color: "#001f3f",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHover: {
    backgroundColor: "#00a3cc",
  },
  resultsWrapper: {
    marginTop: "2rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1rem",
  },
  resultCard: {
    backgroundColor: "#002b4c",
    border: "1px solid #00d8ff",
    borderRadius: "8px",
    padding: "1rem",
    color: "#ffffff",
    textAlign: "left",
  },
  resultTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  resultDetails: {
    fontSize: "1rem",
    marginTop: "0.5rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.5rem 1rem",
    border: "2px solid #00d8ff",
    borderRadius: "8px",
    backgroundColor: "#0e1a2b",
    color: "#ffffff",
    fontSize: "1rem",
    boxShadow: "0 0 10px rgba(0, 216, 255, 0.5)",
  },
  enhancedDropdownItem: {
    padding: "0.75rem 1rem",
    color: "#ffffff",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1e293b",
    transition: "background-color 0.3s ease",
  },
  enhancedSearchButton: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    backgroundColor: "#00d8ff",
    color: "#0e1a2b",
    fontWeight: "bold",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
    boxShadow: "0px 4px 6px rgba(0, 216, 255, 0.3)",
  },
  searchContainerEnhanced: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  enhancedDropdown: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#1e293b",
    border: "1px solid #00d8ff",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0, 216, 255, 0.2)",
    overflow: "hidden",
  },
  enhancedDropdownItem: {
    padding: "0.75rem 1rem",
    color: "#ffffff",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1e293b",
    transition: "background-color 0.3s ease",
  },
  enhancedDropdownItemHover: {
    backgroundColor: "#00a3cc",
  },

  cardsContainer: {
    marginTop: "80px", // Offset for the fixed header
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    padding: "16px",
  },

  alert: {
    position: "fixed",
    top: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "90%",
    zIndex: 100,
    "& .chakra-alert__title": {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "16px",
    },
    "& .chakra-alert__description": {
      color: "#ffffff",
      fontSize: "14px",
    },
    "& .chakra-alert__close-btn": {
      color: "#ffffff",
      fontSize: "18px",
      "&:hover": {
        color: "#00d8ff",
      },
    },
  },
};
