import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Home,
  LayoutDashboard,
  Upload,
  GraduationCap,
  Database,
  Package,
  DollarSign,
  Store,
  Wrench,
  LogIn,
  ChevronRight,
  X,
  Code2,
} from "lucide-react";

// All routes in the application
const routes = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/upload", label: "Upload", icon: Upload },
  { path: "/training", label: "Training", icon: GraduationCap },
  { path: "/datamanagement", label: "Data Management", icon: Database },
  { path: "/product-management", label: "Product Management", icon: Package },
  { path: "/price-comparison", label: "Price Comparison", icon: DollarSign },
  { path: "/store-recommendations", label: "Store Recommendations", icon: Store },
  { path: "/diagnostics", label: "Diagnostics", icon: Wrench },
  { path: "/auth", label: "Auth", icon: LogIn },
];

export function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  // Toggle with keyboard shortcut (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-8 w-8 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
        onClick={() => setIsVisible(true)}
        title="Show Dev Toolbar (⌘+Shift+D)"
      >
        <Code2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg border-purple-700"
            >
              <Code2 className="h-4 w-4 mr-2" />
              Dev Routes
              <ChevronRight
                className={`h-4 w-4 ml-2 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => setIsVisible(false)}
            title="Hide (⌘+Shift+D to show)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CollapsibleContent className="mt-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[220px]">
            <div className="text-xs text-gray-500 px-2 py-1 mb-1">
              Navigate to route:
            </div>
            <div className="space-y-1">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = location.pathname === route.path;
                return (
                  <button
                    key={route.path}
                    onClick={() => {
                      navigate(route.path);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{route.label}</span>
                    <code className="text-xs text-gray-400">{route.path}</code>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-gray-400 px-2 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              ⌘+Shift+D to toggle
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
