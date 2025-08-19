import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TermsContent {
  content: string;
  last_updated: string;
}

const TermsOfService = () => {
  const [content, setContent] = useState<TermsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('cms_terms_content')
          .select('content, last_updated')
          .maybeSingle();

        if (error) throw error;
        setContent(data);
      } catch (error) {
        console.error('Error fetching terms content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-8">
          
          <div className="max-w-4xl mx-auto text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Terms of Service...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            {content?.last_updated && (
              <p className="text-muted-foreground mb-8">
                Last updated: {new Date(content.last_updated).toLocaleDateString()}
              </p>
            )}
          </div>

          <Card>
            <CardContent className="p-8 prose prose-gray dark:prose-invert max-w-none">
              {content?.content ? (
                <div dangerouslySetInnerHTML={{ __html: content.content }} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Terms of Service content not available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;