import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginSystem } from '../../services/PluginSystem';
import { PluginTypes } from '../../services/PluginTypes';

describe('Plugin System Tests', () => {
  let pluginSystem: PluginSystem;

  beforeEach(() => {
    pluginSystem = new PluginSystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Plugin Registration and Discovery', () => {
    it('should register a plugin', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test plugin',
        main: './plugin.js',
        activate: vi.fn(),
        deactivate: vi.fn()
      };

      await pluginSystem.register(plugin);
      
      expect(pluginSystem.getPlugin('test-plugin')).toEqual(plugin);
      expect(pluginSystem.getAllPlugins()).toContain(plugin);
    });

    it('should prevent duplicate plugin registration', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'duplicate-plugin',
        name: 'Duplicate Plugin',
        version: '1.0.0',
        main: './plugin.js'
      };

      await pluginSystem.register(plugin);
      
      await expect(pluginSystem.register(plugin))
        .rejects.toThrow('Plugin duplicate-plugin is already registered');
    });

    it('should discover plugins from directory', async () => {
      const mockPlugins = [
        { id: 'plugin1', name: 'Plugin 1', version: '1.0.0' },
        { id: 'plugin2', name: 'Plugin 2', version: '2.0.0' }
      ];

      vi.spyOn(pluginSystem, 'scanDirectory').mockResolvedValue(mockPlugins);

      const discovered = await pluginSystem.discoverPlugins('/plugins');
      
      expect(discovered).toHaveLength(2);
      expect(discovered[0].id).toBe('plugin1');
    });

    it('should validate plugin manifest', () => {
      const validManifest = {
        id: 'valid-plugin',
        name: 'Valid Plugin',
        version: '1.0.0',
        main: './index.js'
      };

      const invalidManifest = {
        name: 'Invalid Plugin',
        // Missing required fields
      };

      expect(pluginSystem.validateManifest(validManifest)).toBe(true);
      expect(pluginSystem.validateManifest(invalidManifest)).toBe(false);
    });

    it('should handle plugin dependencies', async () => {
      const dependencyPlugin: PluginTypes.Plugin = {
        id: 'dependency',
        name: 'Dependency Plugin',
        version: '1.0.0',
        main: './dep.js'
      };

      const mainPlugin: PluginTypes.Plugin = {
        id: 'main',
        name: 'Main Plugin',
        version: '1.0.0',
        main: './main.js',
        dependencies: {
          'dependency': '^1.0.0'
        }
      };

      await pluginSystem.register(dependencyPlugin);
      await pluginSystem.register(mainPlugin);

      const resolved = pluginSystem.resolveDependencies('main');
      expect(resolved).toContain('dependency');
    });

    it('should detect circular dependencies', async () => {
      const plugin1: PluginTypes.Plugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        version: '1.0.0',
        main: './p1.js',
        dependencies: { 'plugin2': '1.0.0' }
      };

      const plugin2: PluginTypes.Plugin = {
        id: 'plugin2',
        name: 'Plugin 2',
        version: '1.0.0',
        main: './p2.js',
        dependencies: { 'plugin1': '1.0.0' }
      };

      await pluginSystem.register(plugin1);
      await pluginSystem.register(plugin2);

      expect(() => pluginSystem.resolveDependencies('plugin1'))
        .toThrow('Circular dependency detected');
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should activate plugin', async () => {
      const activate = vi.fn();
      const plugin: PluginTypes.Plugin = {
        id: 'lifecycle-plugin',
        name: 'Lifecycle Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('lifecycle-plugin');

      expect(activate).toHaveBeenCalled();
      expect(pluginSystem.isActive('lifecycle-plugin')).toBe(true);
    });

    it('should deactivate plugin', async () => {
      const deactivate = vi.fn();
      const plugin: PluginTypes.Plugin = {
        id: 'deactivate-plugin',
        name: 'Deactivate Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: vi.fn(),
        deactivate
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('deactivate-plugin');
      await pluginSystem.deactivate('deactivate-plugin');

      expect(deactivate).toHaveBeenCalled();
      expect(pluginSystem.isActive('deactivate-plugin')).toBe(false);
    });

    it('should reload plugin', async () => {
      const activate = vi.fn();
      const deactivate = vi.fn();
      
      const plugin: PluginTypes.Plugin = {
        id: 'reload-plugin',
        name: 'Reload Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate,
        deactivate
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('reload-plugin');
      await pluginSystem.reload('reload-plugin');

      expect(deactivate).toHaveBeenCalled();
      expect(activate).toHaveBeenCalledTimes(2);
    });

    it('should uninstall plugin', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'uninstall-plugin',
        name: 'Uninstall Plugin',
        version: '1.0.0',
        main: './plugin.js'
      };

      await pluginSystem.register(plugin);
      await pluginSystem.uninstall('uninstall-plugin');

      expect(pluginSystem.getPlugin('uninstall-plugin')).toBeUndefined();
    });

    it('should handle plugin errors gracefully', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'error-plugin',
        name: 'Error Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: () => {
          throw new Error('Activation failed');
        }
      };

      await pluginSystem.register(plugin);
      
      await expect(pluginSystem.activate('error-plugin'))
        .rejects.toThrow('Activation failed');
      
      expect(pluginSystem.isActive('error-plugin')).toBe(false);
    });
  });

  describe('Plugin API and Extensions', () => {
    it('should provide API to plugins', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'api-plugin',
        name: 'API Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: (api) => {
          expect(api).toHaveProperty('workspace');
          expect(api).toHaveProperty('commands');
          expect(api).toHaveProperty('ui');
          expect(api).toHaveProperty('storage');
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('api-plugin');
    });

    it('should register commands', async () => {
      const commandHandler = vi.fn();
      
      const plugin: PluginTypes.Plugin = {
        id: 'command-plugin',
        name: 'Command Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: (api) => {
          api.commands.register('test.command', commandHandler);
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('command-plugin');

      await pluginSystem.executeCommand('test.command', { arg: 'value' });
      
      expect(commandHandler).toHaveBeenCalledWith({ arg: 'value' });
    });

    it('should register menu items', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'menu-plugin',
        name: 'Menu Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: (api) => {
          api.ui.registerMenuItem({
            id: 'plugin.menu',
            label: 'Plugin Menu',
            command: 'plugin.command'
          });
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('menu-plugin');

      const menuItems = pluginSystem.getMenuItems();
      expect(menuItems).toContainEqual(
        expect.objectContaining({ id: 'plugin.menu' })
      );
    });

    it('should register toolbar buttons', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'toolbar-plugin',
        name: 'Toolbar Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: (api) => {
          api.ui.registerToolbarButton({
            id: 'plugin.button',
            icon: 'icon.svg',
            tooltip: 'Plugin Button',
            command: 'plugin.action'
          });
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('toolbar-plugin');

      const buttons = pluginSystem.getToolbarButtons();
      expect(buttons).toContainEqual(
        expect.objectContaining({ id: 'plugin.button' })
      );
    });

    it('should register views', async () => {
      const ViewComponent = () => null;
      
      const plugin: PluginTypes.Plugin = {
        id: 'view-plugin',
        name: 'View Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: (api) => {
          api.ui.registerView({
            id: 'plugin.view',
            title: 'Plugin View',
            component: ViewComponent,
            location: 'sidebar'
          });
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('view-plugin');

      const views = pluginSystem.getViews();
      expect(views).toContainEqual(
        expect.objectContaining({ id: 'plugin.view' })
      );
    });
  });

  describe('Plugin Communication', () => {
    it('should enable inter-plugin communication', async () => {
      const receivedMessages: any[] = [];
      
      const plugin1: PluginTypes.Plugin = {
        id: 'sender',
        name: 'Sender Plugin',
        version: '1.0.0',
        main: './sender.js',
        activate: (api) => {
          api.messaging.send('receiver', { data: 'Hello' });
        }
      };

      const plugin2: PluginTypes.Plugin = {
        id: 'receiver',
        name: 'Receiver Plugin',
        version: '1.0.0',
        main: './receiver.js',
        activate: (api) => {
          api.messaging.on('message', (msg) => {
            receivedMessages.push(msg);
          });
        }
      };

      await pluginSystem.register(plugin2);
      await pluginSystem.activate('receiver');
      
      await pluginSystem.register(plugin1);
      await pluginSystem.activate('sender');

      expect(receivedMessages).toContainEqual(
        expect.objectContaining({ data: 'Hello' })
      );
    });

    it('should support event broadcasting', async () => {
      const listeners: any[] = [];
      
      const plugin1: PluginTypes.Plugin = {
        id: 'broadcaster',
        name: 'Broadcaster',
        version: '1.0.0',
        main: './broadcast.js',
        activate: (api) => {
          api.events.emit('custom.event', { value: 42 });
        }
      };

      const plugin2: PluginTypes.Plugin = {
        id: 'listener1',
        name: 'Listener 1',
        version: '1.0.0',
        main: './listener1.js',
        activate: (api) => {
          api.events.on('custom.event', (data) => {
            listeners.push({ plugin: 'listener1', data });
          });
        }
      };

      const plugin3: PluginTypes.Plugin = {
        id: 'listener2',
        name: 'Listener 2',
        version: '1.0.0',
        main: './listener2.js',
        activate: (api) => {
          api.events.on('custom.event', (data) => {
            listeners.push({ plugin: 'listener2', data });
          });
        }
      };

      await pluginSystem.register(plugin2);
      await pluginSystem.register(plugin3);
      await pluginSystem.activate('listener1');
      await pluginSystem.activate('listener2');
      
      await pluginSystem.register(plugin1);
      await pluginSystem.activate('broadcaster');

      expect(listeners).toHaveLength(2);
      expect(listeners[0].data.value).toBe(42);
      expect(listeners[1].data.value).toBe(42);
    });
  });

  describe('Plugin Storage', () => {
    it('should provide isolated storage for plugins', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'storage-plugin',
        name: 'Storage Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: async (api) => {
          await api.storage.set('key1', 'value1');
          await api.storage.set('key2', { nested: 'object' });
          
          const value1 = await api.storage.get('key1');
          const value2 = await api.storage.get('key2');
          
          expect(value1).toBe('value1');
          expect(value2).toEqual({ nested: 'object' });
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('storage-plugin');
    });

    it('should isolate storage between plugins', async () => {
      const plugin1: PluginTypes.Plugin = {
        id: 'storage1',
        name: 'Storage 1',
        version: '1.0.0',
        main: './s1.js',
        activate: async (api) => {
          await api.storage.set('shared', 'plugin1');
        }
      };

      const plugin2: PluginTypes.Plugin = {
        id: 'storage2',
        name: 'Storage 2',
        version: '1.0.0',
        main: './s2.js',
        activate: async (api) => {
          await api.storage.set('shared', 'plugin2');
          
          const value = await api.storage.get('shared');
          expect(value).toBe('plugin2'); // Should not see plugin1's value
        }
      };

      await pluginSystem.register(plugin1);
      await pluginSystem.register(plugin2);
      await pluginSystem.activate('storage1');
      await pluginSystem.activate('storage2');
    });

    it('should persist storage across reloads', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'persist-plugin',
        name: 'Persist Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: async (api) => {
          const existing = await api.storage.get('counter');
          const counter = (existing || 0) + 1;
          await api.storage.set('counter', counter);
        }
      };

      await pluginSystem.register(plugin);
      
      await pluginSystem.activate('persist-plugin');
      await pluginSystem.deactivate('persist-plugin');
      await pluginSystem.activate('persist-plugin');
      
      const storage = pluginSystem.getPluginStorage('persist-plugin');
      expect(await storage.get('counter')).toBe(2);
    });
  });

  describe('Plugin Permissions', () => {
    it('should enforce plugin permissions', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'restricted-plugin',
        name: 'Restricted Plugin',
        version: '1.0.0',
        main: './plugin.js',
        permissions: ['filesystem.read'],
        activate: (api) => {
          // Should be allowed
          api.filesystem.readFile('/test.txt');
          
          // Should be denied
          expect(() => api.filesystem.writeFile('/test.txt', 'data'))
            .toThrow('Permission denied: filesystem.write');
        }
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('restricted-plugin');
    });

    it('should request permissions at runtime', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'permission-plugin',
        name: 'Permission Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: async (api) => {
          const granted = await api.permissions.request('network.fetch');
          
          if (granted) {
            await api.network.fetch('https://api.example.com');
          }
        }
      };

      pluginSystem.onPermissionRequest((plugin, permission) => {
        // Simulate user approval
        return permission === 'network.fetch';
      });

      await pluginSystem.register(plugin);
      await pluginSystem.activate('permission-plugin');
    });

    it('should revoke permissions', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'revoke-plugin',
        name: 'Revoke Plugin',
        version: '1.0.0',
        main: './plugin.js',
        permissions: ['filesystem.read', 'filesystem.write']
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('revoke-plugin');
      
      pluginSystem.revokePermission('revoke-plugin', 'filesystem.write');
      
      const permissions = pluginSystem.getPluginPermissions('revoke-plugin');
      expect(permissions).toContain('filesystem.read');
      expect(permissions).not.toContain('filesystem.write');
    });
  });

  describe('Plugin Updates', () => {
    it('should check for plugin updates', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'updatable-plugin',
        name: 'Updatable Plugin',
        version: '1.0.0',
        main: './plugin.js',
        updateUrl: 'https://updates.example.com/plugin'
      };

      await pluginSystem.register(plugin);
      
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.1.0', downloadUrl: 'https://...' })
      } as any);

      const updates = await pluginSystem.checkUpdates();
      
      expect(updates).toContainEqual(
        expect.objectContaining({
          pluginId: 'updatable-plugin',
          currentVersion: '1.0.0',
          newVersion: '1.1.0'
        })
      );
    });

    it('should update plugin', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'update-plugin',
        name: 'Update Plugin',
        version: '1.0.0',
        main: './plugin.js'
      };

      await pluginSystem.register(plugin);
      
      const newPluginData = {
        id: 'update-plugin',
        name: 'Update Plugin',
        version: '1.1.0',
        main: './plugin.js'
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([JSON.stringify(newPluginData)])
      } as any);

      await pluginSystem.updatePlugin('update-plugin', '1.1.0');
      
      const updated = pluginSystem.getPlugin('update-plugin');
      expect(updated?.version).toBe('1.1.0');
    });

    it('should rollback failed updates', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'rollback-plugin',
        name: 'Rollback Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: vi.fn()
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('rollback-plugin');
      
      // Simulate failed update
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Update failed'));

      await expect(pluginSystem.updatePlugin('rollback-plugin', '1.1.0'))
        .rejects.toThrow('Update failed');
      
      // Plugin should still be at original version and active
      const current = pluginSystem.getPlugin('rollback-plugin');
      expect(current?.version).toBe('1.0.0');
      expect(pluginSystem.isActive('rollback-plugin')).toBe(true);
    });
  });

  describe('Plugin Security', () => {
    it('should sandbox plugin execution', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'sandboxed-plugin',
        name: 'Sandboxed Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: () => {
          // Should not have access to global objects
          expect(() => (global as any).process).toThrow();
          expect(() => (global as any).require).toThrow();
        }
      };

      pluginSystem.enableSandbox(true);
      
      await pluginSystem.register(plugin);
      await pluginSystem.activate('sandboxed-plugin');
    });

    it('should validate plugin signatures', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'signed-plugin',
        name: 'Signed Plugin',
        version: '1.0.0',
        main: './plugin.js',
        signature: 'invalid-signature'
      };

      pluginSystem.requireSignatures(true);
      
      await expect(pluginSystem.register(plugin))
        .rejects.toThrow('Invalid plugin signature');
    });

    it('should scan plugins for malicious code', async () => {
      const maliciousPlugin: PluginTypes.Plugin = {
        id: 'malicious-plugin',
        name: 'Malicious Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: () => {
          // Simulated malicious code patterns
          eval('alert("XSS")');
          new Function('return this')();
        }
      };

      pluginSystem.enableSecurityScanning(true);
      
      await expect(pluginSystem.register(maliciousPlugin))
        .rejects.toThrow('Security scan failed: Dangerous code patterns detected');
    });
  });

  describe('Plugin Marketplace', () => {
    it('should search marketplace for plugins', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 'result1', name: 'Plugin 1', downloads: 1000 },
            { id: 'result2', name: 'Plugin 2', downloads: 500 }
          ]
        })
      } as any);

      const results = await pluginSystem.searchMarketplace('test query');
      
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('result1');
    });

    it('should install plugin from marketplace', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'marketplace-plugin',
          name: 'Marketplace Plugin',
          version: '1.0.0',
          downloadUrl: 'https://marketplace.example.com/plugin.zip'
        })
      } as any);

      await pluginSystem.installFromMarketplace('marketplace-plugin');
      
      expect(pluginSystem.getPlugin('marketplace-plugin')).toBeDefined();
    });

    it('should rate and review plugins', async () => {
      const review = {
        pluginId: 'reviewed-plugin',
        rating: 5,
        comment: 'Excellent plugin!'
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as any);

      const result = await pluginSystem.submitReview(review);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Plugin Development Tools', () => {
    it('should provide plugin development API', () => {
      const devApi = pluginSystem.getDevApi();
      
      expect(devApi).toHaveProperty('createPlugin');
      expect(devApi).toHaveProperty('testPlugin');
      expect(devApi).toHaveProperty('debugPlugin');
      expect(devApi).toHaveProperty('packagePlugin');
    });

    it('should scaffold new plugin', async () => {
      const scaffolded = await pluginSystem.scaffoldPlugin({
        name: 'My New Plugin',
        author: 'Developer',
        template: 'basic'
      });

      expect(scaffolded).toHaveProperty('id');
      expect(scaffolded).toHaveProperty('manifest');
      expect(scaffolded).toHaveProperty('files');
      expect(scaffolded.files).toContainEqual(
        expect.objectContaining({ name: 'index.js' })
      );
    });

    it('should hot reload plugin during development', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'dev-plugin',
        name: 'Dev Plugin',
        version: '1.0.0',
        main: './plugin.js',
        activate: vi.fn()
      };

      await pluginSystem.register(plugin);
      await pluginSystem.activate('dev-plugin');
      
      pluginSystem.enableHotReload('dev-plugin');
      
      // Simulate file change
      pluginSystem.triggerHotReload('dev-plugin', {
        changedFile: './plugin.js'
      });

      expect(plugin.activate).toHaveBeenCalledTimes(2);
    });

    it('should debug plugin with breakpoints', async () => {
      const plugin: PluginTypes.Plugin = {
        id: 'debug-plugin',
        name: 'Debug Plugin',
        version: '1.0.0',
        main: './plugin.js'
      };

      await pluginSystem.register(plugin);
      
      const debugSession = pluginSystem.startDebug('debug-plugin');
      
      debugSession.setBreakpoint('./plugin.js', 10);
      debugSession.setBreakpoint('./plugin.js', 20);
      
      expect(debugSession.getBreakpoints()).toHaveLength(2);
    });
  });
});