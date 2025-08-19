import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Book, Phone, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  slug: string;
}

interface HelpFAQ {
  id: string;
  question: string;
  answer: string;
}

const HelpCenter = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<HelpFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch published articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('cms_help_articles')
          .select('id, title, content, slug')
          .eq('is_published', true)
          .order('display_order');

        if (articlesError) throw articlesError;
        setArticles(articlesData || []);

        // Fetch published FAQs
        const { data: faqsData, error: faqsError } = await supabase
          .from('cms_help_faqs')
          .select('id, question, answer')
          .eq('is_published', true)
          .order('display_order');

        if (faqsError) throw faqsError;
        setFaqs(faqsData || []);
      } catch (error) {
        console.error('Error fetching help content:', error);
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
            <p className="text-muted-foreground">Loading Help Center...</p>
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
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-muted-foreground">
              Get the support you need to make the most of AirLogs
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Get help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Need personalized assistance? Our support team is here to help.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:hello@airlogs.nz">Contact Us</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Help Articles */}
          {articles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Help Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article) => (
                  <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-muted-foreground line-clamp-3" 
                        dangerouslySetInnerHTML={{ 
                          __html: article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                        }} 
                      />
                      <Button variant="link" className="p-0 h-auto mt-2">
                        Read more →
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <Card key={faq.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-muted-foreground prose prose-gray dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: faq.answer }} 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && articles.length === 0 && faqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No help content available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;