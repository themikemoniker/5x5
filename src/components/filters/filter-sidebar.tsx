"use client";

import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterState, DEFAULT_FILTERS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCounties: string[];
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  availableCounties,
}: FilterSidebarProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCounty = (county: string) => {
    const counties = filters.counties.includes(county)
      ? filters.counties.filter((c) => c !== county)
      : [...filters.counties, county];
    updateFilter("counties", counties);
  };

  const hasActiveFilters =
    filters.counties.length > 0 ||
    filters.sfrOnly ||
    filters.maxLienAmount < 50000 ||
    filters.minDealScore > 0 ||
    filters.auctionDateStart !== null ||
    filters.auctionDateEnd !== null ||
    filters.savedOnly;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* SFR Only Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">SFR Only</label>
          <Switch
            checked={filters.sfrOnly}
            onCheckedChange={(checked) => updateFilter("sfrOnly", checked)}
          />
        </div>

        {/* Saved Only Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Saved Only</label>
          <Switch
            checked={filters.savedOnly}
            onCheckedChange={(checked) => updateFilter("savedOnly", checked)}
          />
        </div>

        {/* County Multi-Select */}
        {availableCounties.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">County</label>
            <div className="flex flex-wrap gap-1.5">
              {availableCounties.map((county) => (
                <Badge
                  key={county}
                  variant={filters.counties.includes(county) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleCounty(county)}
                >
                  {county}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Max Lien Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Max Lien Amount</label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(filters.maxLienAmount)}
            </span>
          </div>
          <Slider
            value={[filters.maxLienAmount]}
            onValueChange={([value]) => updateFilter("maxLienAmount", value)}
            max={50000}
            min={0}
            step={500}
          />
        </div>

        {/* Min Deal Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Min Deal Score</label>
            <span className="text-sm text-muted-foreground">
              {filters.minDealScore}
            </span>
          </div>
          <Slider
            value={[filters.minDealScore]}
            onValueChange={([value]) => updateFilter("minDealScore", value)}
            max={100}
            min={0}
            step={5}
          />
        </div>

        {/* Auction Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Auction Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.auctionDateStart || ""}
              onChange={(e) =>
                updateFilter("auctionDateStart", e.target.value || null)
              }
              placeholder="Start"
              className="text-xs"
            />
            <Input
              type="date"
              value={filters.auctionDateEnd || ""}
              onChange={(e) =>
                updateFilter("auctionDateEnd", e.target.value || null)
              }
              placeholder="End"
              className="text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
