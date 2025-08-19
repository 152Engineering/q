import { Card, CardContent } from "@/components/ui/card";

interface Airport {
  id: string;
  ident: string;
  name: string | null;
  type: string | null;
  iso_country: string | null;
  elevation_ft: number | null;
}

interface AirportInfoProps {
  airport: Airport | null;
  label: string;
}

export const AirportInfo = ({ airport, label }: AirportInfoProps) => {
  if (!airport) return null;

  return (
    <Card className="mt-2">
      <CardContent className="pt-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">{label} Information</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Code:</span> {airport.ident}
          </div>
          <div>
            <span className="font-medium">Type:</span> {airport.type || "N/A"}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Name:</span> {airport.name || "N/A"}
          </div>
          <div>
            <span className="font-medium">Elevation:</span> {airport.elevation_ft ? `${airport.elevation_ft} ft` : "N/A"}
          </div>
          <div>
            <span className="font-medium">Country:</span> {airport.iso_country || "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};