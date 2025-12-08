'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Psychiatrist } from '@/lib/supabase';
import { CheckCircle2, MapPin, Building2, CreditCard } from 'lucide-react';

interface PsychiatristCardProps {
  psychiatrist: Psychiatrist;
  onSelect?: (psychiatrist: Psychiatrist) => void;
  selected?: boolean;
}

export function PsychiatristCard({ psychiatrist, onSelect, selected }: PsychiatristCardProps) {
  return (
    <Card className={`transition-all ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{psychiatrist.name}</CardTitle>
            <CardDescription className="mt-1">{psychiatrist.specialty}</CardDescription>
          </div>
          {psychiatrist.accepts_new_patients && (
            <Badge variant="default" className="ml-2">
              Accepting New Patients
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm">{psychiatrist.location}</span>
        </div>

        {/* Insurance */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Insurance Accepted:</p>
              <div className="flex flex-wrap gap-1">
                {psychiatrist.insurance_carriers.map((carrier) => {
                  const isInNetwork = psychiatrist.in_network_carriers.includes(carrier);
                  return (
                    <Badge
                      key={carrier}
                      variant={isInNetwork ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {carrier}
                      {isInNetwork && ' (In-Network)'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        {psychiatrist.accepts_cash_pay && (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Accepts cash pay</span>
          </div>
        )}

        {/* Contact Info */}
        {(psychiatrist.email || psychiatrist.phone) && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Contact:</p>
            {psychiatrist.email && (
              <p className="text-xs">{psychiatrist.email}</p>
            )}
            {psychiatrist.phone && (
              <p className="text-xs">{psychiatrist.phone}</p>
            )}
          </div>
        )}
      </CardContent>
      {onSelect && (
        <CardFooter>
          <Button
            onClick={() => onSelect(psychiatrist)}
            className="w-full"
            variant={selected ? 'default' : 'outline'}
          >
            {selected ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Selected
              </>
            ) : (
              'Select This Psychiatrist'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

