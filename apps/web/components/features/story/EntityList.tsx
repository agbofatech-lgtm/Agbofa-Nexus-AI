"use client";

import { Building2, MapPin, Tags, UserRound } from "lucide-react";

export interface EntityListProps {
  people?: string[];
  organizations?: string[];
  locations?: string[];
  onSelect?: (entity: string) => void;
}

const groups = [
  { key: "people", label: "People", icon: UserRound },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "locations", label: "Locations", icon: MapPin },
] as const;

export function EntityList({
  people = [],
  organizations = [],
  locations = [],
  onSelect,
}: EntityListProps) {
  const values = { people, organizations, locations };
  const hasEntities = people.length || organizations.length || locations.length;
  if (!hasEntities) return null;

  return (
    <section className="entity-list glass" aria-labelledby="entity-list-title">
      <div className="entity-list__heading">
        <span>
          <Tags size={16} />
        </span>
        <div>
          <span className="section-kicker">Story graph</span>
          <h2 id="entity-list-title">Entities in this story</h2>
        </div>
      </div>
      <div className="entity-list__groups">
        {groups.map((group) => {
          const Icon = group.icon;
          const entities = values[group.key];
          if (!entities.length) return null;
          return (
            <div key={group.key} className="entity-group">
              <h3>
                <Icon size={13} /> {group.label}
              </h3>
              <div>
                {entities.map((entity) => (
                  <button
                    key={entity}
                    onClick={() => onSelect?.(entity)}
                    type="button"
                  >
                    {entity}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
