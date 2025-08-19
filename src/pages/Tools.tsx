import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { usePinnedTools, tools, Tool } from "@/hooks/usePinnedTools";
import { Pin, PinOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Tools = () => {
  const navigate = useNavigate();
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const { pinnedTools, togglePin } = usePinnedTools();
  

  const handleToolClick = (tool: Tool, event?: React.MouseEvent) => {
    // If clicking the pin button, don't navigate
    if (event && (event.target as HTMLElement).closest('.pin-button')) {
      return;
    }
    
    if (tool.action) {
      tool.action();
    } else if (tool.path) {
      navigate(tool.path);
    }
  };

  const handleTogglePin = (toolTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const result = togglePin(toolTitle);
    
    if (result.success) {
      toast({
        title: result.isPinned ? "Tool pinned" : "Tool unpinned",
        description: result.isPinned 
          ? `${toolTitle} added to navigation bar`
          : `${toolTitle} removed from navigation bar`,
      });
    } else {
      toast({
        title: "Maximum pins reached",
        description: "You can only pin up to 2 tools. Unpin a tool first.",
        variant: "destructive",
      });
    }
  };

  const handleOpenBudget = () => {
    window.open("https://airbudget.nz", "_blank");
    setShowBudgetDialog(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Aviation Tools</h1>
        
        {pinnedTools.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Pinned Tools ({pinnedTools.length}/2)</h3>
            <p className="text-sm text-muted-foreground">
              Your pinned tools appear in the bottom navigation bar for quick access.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const isPinned = pinnedTools.includes(tool.title);
            
            return (
              <Card 
                key={tool.title} 
                className="cursor-pointer hover:shadow-md transition-shadow p-6 relative"
                onClick={(e) => handleToolClick(tool, e)}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <i className={`fas ${tool.icon} text-2xl`} />
                  <h3 className="font-semibold">
                    {tool.title}
                  </h3>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="pin-button absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={(e) => handleTogglePin(tool.title, e)}
                >
                  {isPinned ? (
                    <PinOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Pin className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <AlertDialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Open External Budget Tool</AlertDialogTitle>
              <AlertDialogDescription>
                This will open AirBudget.nz in a new tab. This is an external service 
                for flight cost tracking and budgeting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleOpenBudget}>
                Open in New Tab
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default Tools;