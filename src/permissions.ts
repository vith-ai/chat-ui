import type {
  ToolDefinition,
  ToolRegistry,
  PermissionConfig,
  PermissionLevel,
  ApprovalRisk,
} from './types'

/**
 * Default tool registry implementation
 */
export function createToolRegistry(initialTools: ToolDefinition[] = []): ToolRegistry {
  const tools: Map<string, ToolDefinition> = new Map(
    initialTools.map(t => [t.name, t])
  )

  return {
    get tools() {
      return Array.from(tools.values())
    },

    getPermission(toolName: string): PermissionLevel {
      const tool = tools.get(toolName)
      return tool?.permission || 'confirm'
    },

    requiresConfirmation(toolName: string): boolean {
      const permission = this.getPermission(toolName)
      return permission === 'confirm'
    },

    register(tool: ToolDefinition): void {
      tools.set(tool.name, tool)
    },

    setPermission(toolName: string, level: PermissionLevel): void {
      const tool = tools.get(toolName)
      if (tool) {
        tool.permission = level
      }
    },
  }
}

/**
 * Built-in tool definitions for common agentic patterns
 */
export const commonTools: ToolDefinition[] = [
  // File operations
  {
    name: 'read_file',
    description: 'Read contents of a file',
    permission: 'auto',
    risk: 'low',
    categories: ['filesystem'],
  },
  {
    name: 'write_file',
    description: 'Write or create a file',
    permission: 'confirm',
    risk: 'medium',
    categories: ['filesystem'],
  },
  {
    name: 'delete_file',
    description: 'Delete a file',
    permission: 'confirm',
    risk: 'high',
    categories: ['filesystem'],
  },
  {
    name: 'list_directory',
    description: 'List files in a directory',
    permission: 'auto',
    risk: 'low',
    categories: ['filesystem'],
  },

  // Code execution
  {
    name: 'run_code',
    description: 'Execute code',
    permission: 'confirm',
    risk: 'high',
    categories: ['execution'],
  },
  {
    name: 'run_shell',
    description: 'Run a shell command',
    permission: 'confirm',
    risk: 'high',
    categories: ['execution'],
  },

  // Web/API
  {
    name: 'web_search',
    description: 'Search the web',
    permission: 'auto',
    risk: 'low',
    categories: ['web'],
  },
  {
    name: 'fetch_url',
    description: 'Fetch content from a URL',
    permission: 'notify',
    risk: 'low',
    categories: ['web'],
  },
  {
    name: 'api_request',
    description: 'Make an API request',
    permission: 'confirm',
    risk: 'medium',
    categories: ['web'],
  },

  // Database
  {
    name: 'db_query',
    description: 'Execute a database query',
    permission: 'confirm',
    risk: 'medium',
    categories: ['database'],
  },
  {
    name: 'db_write',
    description: 'Write to database',
    permission: 'confirm',
    risk: 'high',
    categories: ['database'],
  },
]

/**
 * Permission presets for different use cases
 */
export const permissionPresets = {
  /** Allow everything (development/testing) */
  permissive: {
    defaultPermission: 'auto' as PermissionLevel,
  },

  /** Require confirmation for writes, auto for reads */
  standard: {
    defaultPermission: 'confirm' as PermissionLevel,
    categoryPermissions: {
      filesystem: 'notify' as PermissionLevel,
      web: 'auto' as PermissionLevel,
    },
    toolPermissions: {
      read_file: 'auto' as PermissionLevel,
      list_directory: 'auto' as PermissionLevel,
      web_search: 'auto' as PermissionLevel,
    },
  },

  /** Confirm everything (high security) */
  strict: {
    defaultPermission: 'confirm' as PermissionLevel,
  },

  /** Deny execution tools */
  noExecution: {
    defaultPermission: 'confirm' as PermissionLevel,
    categoryPermissions: {
      execution: 'deny' as PermissionLevel,
    },
  },
}

/**
 * Get effective permission level for a tool
 */
export function getEffectivePermission(
  toolName: string,
  tool: ToolDefinition | undefined,
  config: PermissionConfig
): PermissionLevel {
  // Check tool-specific override first
  if (config.toolPermissions?.[toolName]) {
    return config.toolPermissions[toolName]
  }

  // Check category-based permissions
  if (tool?.categories && config.categoryPermissions) {
    for (const category of tool.categories) {
      if (config.categoryPermissions[category]) {
        return config.categoryPermissions[category]
      }
    }
  }

  // Use tool's default permission
  if (tool?.permission) {
    return tool.permission
  }

  // Fall back to config default
  return config.defaultPermission
}

/**
 * Get risk level display props
 */
export function getRiskDisplay(risk: ApprovalRisk): {
  color: string
  bgColor: string
  label: string
} {
  switch (risk) {
    case 'low':
      return {
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        label: 'Low Risk',
      }
    case 'medium':
      return {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        label: 'Medium Risk',
      }
    case 'high':
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        label: 'High Risk',
      }
  }
}
