"use client";

import React, { useCallback, useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCsv, ParseResult } from "@/services/parser";
import { RawParcel } from "@/lib/types";
import { SAMPLE_PARCELS } from "@/lib/seed-data";

// TODO [R2]: Replace CSV upload with automated county website scraping

interface CsvUploadProps {
  onParsed: (parcels: RawParcel[]) => void;
  disabled?: boolean;
}

export function CsvUpload({ onParsed, disabled }: CsvUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [defaultCounty, setDefaultCounty] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCsv(text, defaultCounty || undefined);
        setParseResult(result);
        if (result.parcels.length > 0) {
          onParsed(result.parcels);
        }
      };
      reader.readAsText(file);
    },
    [defaultCounty, onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Tax Sale List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Default County (if not in CSV)
          </label>
          <Input
            placeholder="e.g., Marion"
            value={defaultCounty}
            onChange={(e) => setDefaultCounty(e.target.value)}
            className="mt-1"
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Indiana county tax sale list (.csv)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => onParsed(SAMPLE_PARCELS)}
        >
          <Database className="h-4 w-4 mr-2" />
          Load Sample Data (20 Indiana parcels)
        </Button>

        {parseResult && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">
              Parsed {parseResult.parcels.length} parcels
            </p>
            {parseResult.errors.length > 0 && (
              <div className="text-sm text-destructive space-y-1">
                <p className="font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {parseResult.errors.length} parsing errors:
                </p>
                <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                  {parseResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseResult.errors.length > 10 && (
                    <li>...and {parseResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
            {parseResult.unmappedHeaders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Unmapped columns: {parseResult.unmappedHeaders.join(", ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
