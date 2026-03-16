"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Globe, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RawParcel } from "@/lib/types";

interface CountySource {
  county: string;
  state: string;
  type: string;
}

interface LiveFetchProps {
  onFetched: (parcels: RawParcel[]) => void;
  disabled?: boolean;
}

export function LiveFetch({ onFetched, disabled }: LiveFetchProps) {
  const [sources, setSources] = useState<CountySource[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCounty, setFetchingCounty] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ county: string; count: number } | null>(null);

  useEffect(() => {
    fetch("/api/scrape")
      .then((r) => r.json())
      .then((data) => setSources(data.sources || []))
      .catch(() => {});
  }, []);

  const handleFetch = useCallback(
    async (county: string, state: string) => {
      setLoading(true);
      setFetchingCounty(county);
      setError(null);
      setLastResult(null);

      try {
        const response = await fetch(
          `/api/scrape?county=${encodeURIComponent(county)}&state=${state}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Fetch failed");
          return;
        }

        if (data.parcels && data.parcels.length > 0) {
          onFetched(data.parcels);
          setLastResult({ county, count: data.count });
        } else {
          setError(`No parcels found for ${county} County`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
        setFetchingCounty(null);
      }
    },
    [onFetched]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Fetch Live Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live sources */}
        {sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pull directly from county data sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((src) => (
                <Button
                  key={`${src.state}-${src.county}`}
                  variant="outline"
                  size="sm"
                  disabled={disabled || loading}
                  onClick={() => handleFetch(src.county, src.state)}
                >
                  {fetchingCounty === src.county && (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  )}
                  {src.county}, {src.state}
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {src.type}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Manual sources */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Other counties — download CSV/Excel from:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="https://www.sriservices.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              SRI Services
            </a>
            <span className="text-muted-foreground">|</span>
            <a
              href="https://www.zeusauction.com/auctions.php"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Zeus Auction
            </a>
            <span className="text-muted-foreground">|</span>
            <a
              href="https://maps.indy.gov/TaxSaleViewer/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Marion County Map
            </a>
          </div>
        </div>

        {/* Status messages */}
        {lastResult && (
          <p className="text-sm font-medium text-green-600">
            Fetched {lastResult.count} parcels from {lastResult.county} County
          </p>
        )}

        {error && (
          <div className="text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
