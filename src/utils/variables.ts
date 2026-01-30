/**
 * Boxy Template Variable Processor
 */

import { BUILTIN_VARIABLES } from '@/config/constants';
import { formatDate, formatTime, formatDateTime, getWeekday, getMonth, generateUUID } from './helpers';

/**
 * Extract all variables from content
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Separate variables into built-in and custom
 */
export function classifyVariables(variables: string[]): {
  builtin: string[];
  custom: string[];
} {
  const builtin: string[] = [];
  const custom: string[] = [];
  
  for (const v of variables) {
    if (BUILTIN_VARIABLES.includes(v as typeof BUILTIN_VARIABLES[number])) {
      builtin.push(v);
    } else {
      custom.push(v);
    }
  }
  
  return { builtin, custom };
}

/**
 * Get value for a built-in variable
 */
export function getBuiltinValue(variable: string): string {
  const now = new Date();
  
  switch (variable) {
    case 'date':
    case 'today':
      return formatDate(now);
    
    case 'time':
    case 'now':
      return formatTime(now);
    
    case 'datetime':
      return formatDateTime(now);
    
    case 'timestamp':
      return Date.now().toString();
    
    case 'random':
      return Math.floor(Math.random() * 900000 + 100000).toString();
    
    case 'uuid':
      return generateUUID();
    
    case 'weekday':
      return getWeekday(now);
    
    case 'month':
      return getMonth(now);
    
    case 'year':
      return now.getFullYear().toString();
    
    case 'clipboard':
      // Clipboard access requires async, return placeholder
      return '[clipboard]';
    
    default:
      return `{{${variable}}}`;
  }
}

/**
 * Replace all variables in content
 */
export function replaceVariables(
  content: string,
  customValues: Record<string, string> = {}
): string {
  return content.replace(
    /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,
    (match, varName) => {
      // Check if custom value provided
      if (customValues[varName] !== undefined) {
        return customValues[varName];
      }
      
      // Check if built-in
      if (BUILTIN_VARIABLES.includes(varName as typeof BUILTIN_VARIABLES[number])) {
        return getBuiltinValue(varName);
      }
      
      // Return original if not found
      return match;
    }
  );
}

/**
 * Check if content has custom variables
 */
export function hasCustomVariables(content: string): boolean {
  const variables = extractVariables(content);
  const { custom } = classifyVariables(variables);
  return custom.length > 0;
}

/**
 * Get list of custom variables in content
 */
export function getCustomVariables(content: string): string[] {
  const variables = extractVariables(content);
  const { custom } = classifyVariables(variables);
  return custom;
}

/**
 * Process content for copying (with optional clipboard access)
 */
export async function processContentForCopy(
  content: string,
  customValues: Record<string, string> = {}
): Promise<string> {
  let result = content;
  
  // Handle clipboard variable specially if present
  if (content.includes('{{clipboard}}')) {
    try {
      const clipboardText = await navigator.clipboard.readText();
      result = result.replace(/\{\{clipboard\}\}/g, clipboardText);
    } catch {
      // Permission denied or not available
      result = result.replace(/\{\{clipboard\}\}/g, '');
    }
  }
  
  // Replace all other variables
  result = replaceVariables(result, customValues);
  
  return result;
}
