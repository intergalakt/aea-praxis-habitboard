import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WeatherView } from "../weather.service";

/** Reine Darstellung — bekommt fertig formatierte Strings, rechnet nicht selbst. */
export function WeatherCard({ view }: { view: WeatherView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-baseline gap-2">
          <span aria-hidden="true" className="text-2xl">
            {view.symbol}
          </span>
          <span>{view.place}</span>
        </CardTitle>
        {view.observedAt ? (
          <p className="text-sm text-muted-foreground">Stand: {view.observedAt}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-4xl font-semibold">{view.temperature}</p>
          <p className="text-base text-muted-foreground">{view.description}</p>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Gefühlt</dt>
            <dd className="font-medium">{view.apparent}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Heute</dt>
            <dd className="font-medium">
              {view.todayMin} bis {view.todayMax}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Wind</dt>
            <dd className="font-medium">{view.wind}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
