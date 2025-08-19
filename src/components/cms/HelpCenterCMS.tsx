import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import { Badge } from '@/components/ui/badge';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  display_order: number;
}

interface HelpFAQ {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
  display_order: number;
}

const HelpCenterCMS: React.FC = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<HelpFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('cms_help_articles')
        .select('*')
        .order('display_order');

      if (articlesError) throw articlesError;
      setArticles(articlesData || []);

      // Fetch FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('cms_help_faqs')
        .select('*')
        .order('display_order');

      if (faqsError) throw faqsError;
      setFaqs(faqsData || []);
    } catch (error) {
      console.error('Error fetching help content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load help content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Article handlers
  const handleSaveArticle = async (article: HelpArticle) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_help_articles')
        .update({
          title: article.title,
          content: article.content,
          slug: article.slug,
          is_published: article.is_published,
        })
        .eq('id', article.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Article updated successfully',
      });
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddArticle = async () => {
    const newArticle = {
      title: 'New Help Article',
      content: '<h1>New Help Article</h1><p>Add your content here...</p>',
      slug: 'new-help-article',
      is_published: false,
      display_order: articles.length + 1,
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cms_help_articles')
        .insert([newArticle])
        .select()
        .single();

      if (error) throw error;

      setArticles([...articles, data]);
      toast({
        title: 'Success',
        description: 'Article added successfully',
      });
    } catch (error) {
      console.error('Error adding article:', error);
      toast({
        title: 'Error',
        description: 'Failed to add article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_help_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      setArticles(articles.filter(a => a.id !== articleId));
      toast({
        title: 'Success',
        description: 'Article deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateArticle = (articleId: string, updates: Partial<HelpArticle>) => {
    setArticles(articles.map(a => 
      a.id === articleId ? { ...a, ...updates } : a
    ));
  };

  // FAQ handlers
  const handleSaveFAQ = async (faq: HelpFAQ) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_help_faqs')
        .update({
          question: faq.question,
          answer: faq.answer,
          is_published: faq.is_published,
        })
        .eq('id', faq.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      });
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to save FAQ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFAQ = async () => {
    const newFAQ = {
      question: 'New FAQ Question',
      answer: '<p>Add your answer here...</p>',
      is_published: false,
      display_order: faqs.length + 1,
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cms_help_faqs')
        .insert([newFAQ])
        .select()
        .single();

      if (error) throw error;

      setFaqs([...faqs, data]);
      toast({
        title: 'Success',
        description: 'FAQ added successfully',
      });
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to add FAQ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (faqId: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_help_faqs')
        .delete()
        .eq('id', faqId);

      if (error) throw error;

      setFaqs(faqs.filter(f => f.id !== faqId));
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFAQ = (faqId: string, updates: Partial<HelpFAQ>) => {
    setFaqs(faqs.map(f => 
      f.id === faqId ? { ...f, ...updates } : f
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Help Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Help Center Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Help Articles</h3>
              <Button onClick={handleAddArticle} disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </div>
            
            {articles.map((article) => (
              <Card key={article.id} className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    {!article.is_published && (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteArticle(article.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Article Title</Label>
                      <Input
                        value={article.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          updateArticle(article.id, { 
                            title: newTitle,
                            slug: generateSlug(newTitle)
                          });
                        }}
                        placeholder="Enter article title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <Input
                        value={article.slug}
                        onChange={(e) => updateArticle(article.id, { slug: e.target.value })}
                        placeholder="article-url-slug"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Article Content</Label>
                    <TipTapEditor
                      content={article.content}
                      onUpdate={(newContent) => updateArticle(article.id, { content: newContent })}
                      placeholder="Enter article content..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={article.is_published}
                      onCheckedChange={(checked) => updateArticle(article.id, { is_published: checked })}
                    />
                    <Label>Published</Label>
                  </div>

                  <Button
                    onClick={() => handleSaveArticle(article)}
                    disabled={saving}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Article'}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {articles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No articles found.
                <br />
                <Button onClick={handleAddArticle} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Article
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="faqs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Frequently Asked Questions</h3>
              <Button onClick={handleAddFAQ} disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </div>
            
            {faqs.map((faq) => (
              <Card key={faq.id} className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    {!faq.is_published && (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFAQ(faq.id, { question: e.target.value })}
                      placeholder="Enter FAQ question..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <TipTapEditor
                      content={faq.answer}
                      onUpdate={(newContent) => updateFAQ(faq.id, { answer: newContent })}
                      placeholder="Enter FAQ answer..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={faq.is_published}
                      onCheckedChange={(checked) => updateFAQ(faq.id, { is_published: checked })}
                    />
                    <Label>Published</Label>
                  </div>

                  <Button
                    onClick={() => handleSaveFAQ(faq)}
                    disabled={saving}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save FAQ'}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {faqs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No FAQs found.
                <br />
                <Button onClick={handleAddFAQ} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First FAQ
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HelpCenterCMS;