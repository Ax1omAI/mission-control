type CoreTeamSettings = {
  enabled: boolean;
  names: string[];
};

const DEFAULT_NAMES = ['Axiom', 'Anvil', 'Beacon', 'Forge'];

const coreTeamSettings: CoreTeamSettings = {
  enabled: (process.env.CORE_TEAM_LOCK || '').toLowerCase() === 'true',
  names: (process.env.CORE_TEAM_AGENT_NAMES || DEFAULT_NAMES.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

if (coreTeamSettings.names.length === 0) {
  coreTeamSettings.names = DEFAULT_NAMES;
}

export function getCoreTeamSettings(): CoreTeamSettings {
  return {
    enabled: coreTeamSettings.enabled,
    names: [...coreTeamSettings.names],
  };
}

export function updateCoreTeamSettings(input: Partial<CoreTeamSettings>) {
  if (typeof input.enabled === 'boolean') {
    coreTeamSettings.enabled = input.enabled;
  }

  if (Array.isArray(input.names)) {
    const cleaned = input.names.map((n) => n.trim()).filter(Boolean);
    coreTeamSettings.names = cleaned.length > 0 ? cleaned : DEFAULT_NAMES;
  }

  return getCoreTeamSettings();
}
