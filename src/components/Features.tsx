import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  BookOpen, 
  Calculator, 
  Settings, 
  Fuel, 
  ClipboardList,
  FileText,
  Gauge
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Plane,
      title: "Flight Planning",
      description: "Plan and track your flights with fuel calculations, live fuel & tank switch reminders, then save your flight to your logbook.",
      comingSoon: false
    },
    {
      icon: BookOpen,
      title: "Digital Logbook",
      description: "Maintain accurate flight records with automatic logging, detailed flight history, and regulatory compliance.",
      comingSoon: false
    },
    {
      icon: ClipboardList,
      title: "Interactive Checklists",
      description: "Stay safe with digital checklists for pre-flight, in-flight, and post-flight procedures.",
      comingSoon: true
    },
    {
      icon: Calculator,
      title: "E6B Flight Computer",
      description: "Perform flight calculations with our built-in E6B computer for navigation, fuel, and performance.",
      comingSoon: true
    },
    {
      icon: Fuel,
      title: "Fuel Management",
      description: "Track fuel consumption, tank switching, and fuel planning with precise monitoring tools.",
      comingSoon: false
    },
    {
      icon: Settings,
      title: "Aircraft Management",
      description: "Manage multiple aircraft profiles with performance data, maintenance schedules, and crew information.",
      comingSoon: true
    },
    {
      icon: FileText,
      title: "Document Viewer",
      description: "Access charts, manuals, and aviation documents with our integrated PDF viewer.",
      comingSoon: true
    },
    {
      icon: Gauge,
      title: "Flight Tools",
      description: "Access essential aviation tools including scratch pad, unit conversions, and flight computers.",
      comingSoon: true
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Useful Tools That Keeps You Flying
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern flight logging and management app helping you be a safe and efficient pilot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow relative">
              {feature.comingSoon && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                  Coming Soon
                </Badge>
              )}
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;