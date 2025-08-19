import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.css'
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient();

console.log('main.tsx loaded');
const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  console.log('Creating React root');
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster />
          <Sonner position="bottom-right" />
          <App />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
  console.log('React app rendered');
} else {
  console.error('Root element not found!');
}
