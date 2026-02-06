/**
 * TYPESCRIPT FIX: Additional type definitions for plugin system internals
 * Separated to avoid circular dependencies and improve type safety
 */

import React from 'react';
import {
  DialogOptions,
  DialogResult,
  MenuItemConfig,
  ToolbarButtonConfig,
  PanelConfig,
  VB6StoreState,
  StorageValue,
} from './PluginSystem';

export interface PluginModule {
  activate?: (context: PluginContext) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
  [key: string]: unknown;
}

export interface SandboxedAPI {
  ui?: {
    showNotification: (message: string, type?: string) => void;
    showDialog: (options: DialogOptions) => Promise<DialogResult>;
    registerMenuItem: (menu: string, item: MenuItemConfig) => void;
    registerToolbarButton: (button: ToolbarButtonConfig) => void;
    registerPanel: (panel: PanelConfig) => void;
  };
  store?: {
    getState: () => VB6StoreState;
    subscribe: (listener: () => void) => () => void;
  };
  file?: {
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    list: (path: string) => Promise<string[]>;
  };
  network?: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  utils: {
    uuid: () => string;
    debounce: <T extends (...args: unknown[]) => unknown>(fn: T, ms: number) => T;
    throttle: <T extends (...args: unknown[]) => unknown>(fn: T, ms: number) => T;
  };
  eventSystem: {
    fire: (sender: string, event: string, data: EventData) => void;
    on: (sender: string, event: string, handler: EventHandler) => () => void;
  };
}

export type EventData = string | number | boolean | null | Record<string, unknown> | unknown[];

export type EventHandler = (...args: unknown[]) => void | boolean;

export interface PluginProxy {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export interface SerializedAPI {
  [key: string]: unknown | { __type: string; name: string };
}

export interface PluginContext {
  subscriptions: unknown[];
  extensionPath: string;
  globalState: {
    get: (key: string) => StorageValue | null;
    update: (key: string, value: StorageValue) => void;
  };
  workspaceState: {
    get: (key: string) => StorageValue | null;
    update: (key: string, value: StorageValue) => void;
  };
}
