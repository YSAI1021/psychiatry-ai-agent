"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Psychiatrist } from "@/lib/store";
import { Star, MapPin, Shield, Calendar } from "lucide-react";

interface PsychiatristCardProps {
  psychiatrist: Psychiatrist;
  onSelect: (psychiatrist: Psychiatrist) => void;
  selected?: boolean;
}

/**
 * Psychiatrist Recommendation Card Component
 * Displays psychiatrist information with insurance and location details
 */
export function PsychiatristCard({ psychiatrist, onSelect, selected }: PsychiatristCardProps) {
  return (
    <Card className={`cursor-pointer transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{psychiatrist.name}</CardTitle>
            <CardDescription className="mt-1">
              {psychiatrist.experience} years of experience
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{psychiatrist.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Specialties */}
        <div>
          <p className="text-sm font-medium mb-2">Specialties:</p>
          <div className="flex flex-wrap gap-2">
            {psychiatrist.specialty.map((spec) => (
              <Badge key={spec} variant="secondary">
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{psychiatrist.location}</span>
        </div>

        {/* Insurance */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Insurance:</span>
            <Badge variant={psychiatrist.insurance.networkStatus === "in-network" ? "default" : "outline"}>
              {psychiatrist.insurance.networkStatus}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            {psychiatrist.insurance.carriers.join(", ")}
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{psychiatrist.availability.join(", ")}</span>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground">{psychiatrist.bio}</p>

        {/* Select Button */}
        <Button
          onClick={() => onSelect(psychiatrist)}
          className="w-full"
          variant={selected ? "default" : "outline"}
        >
          {selected ? "Selected" : "Select & Book"}
        </Button>
      </CardContent>
    </Card>
  );
}

