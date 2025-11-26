import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

// Start early data prefetch in parallel (non-blocking)
Promise.resolve().then(() => {
  queryClient.prefetchQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    }
  });
});

// Render React immediately - no blocking dynamic imports
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
