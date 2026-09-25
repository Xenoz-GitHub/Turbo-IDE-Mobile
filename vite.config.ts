import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw-custom.js',
        injectManifest: {
          injectionPoint: undefined,
        },
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'screenshots/screenshot-desktop.png',
          'screenshots/screenshot-mobile.png',
          'offline.html',
          'pwabuilder-sw.js',
          'sw-custom.js',
        ],
        manifest: {
          id: '/#ide',
          name: 'Turbo C++ Mobile',
          short_name: 'Turbo C++',
          description: 'Production-quality mobile environment for Borland Turbo C++ 3.0 with conio.h, graphics.h, touch keyboard, and native Android/iOS architecture.',
          theme_color: '#0000AA',
          background_color: '#0000AA',
          display: 'standalone',
          orientation: 'any',
          start_url: '/#ide',
          scope: '/',
          lang: 'en',
          dir: 'ltr',
          categories: ['education', 'developer tools', 'utilities', 'productivity'],
          prefer_related_applications: false,
          related_applications: [
            {
              platform: 'play',
              url: 'https://play.google.com/store/apps/details?id=com.encryptedcrew.turbocpp',
              id: 'com.encryptedcrew.turbocpp'
            }
          ],
          scope_extensions: [
            {
              origin: 'https://turbo-ide.vercel.app'
            },
            {
              origin: 'https://*.vercel.app'
            },
            {
              origin: 'https://github.com'
            }
          ],
          note_taking: {
            new_note_url: '/#ide?action=new'
          },
          widgets: [
            {
              name: 'Quick Code',
              short_name: 'Code',
              description: 'Quickly open and edit your C++ code',
              tag: 'quick-code',
              template: 'quick-code-template',
              ms_ac_template: 'widgets/quick-code.json',
              data: '/#ide',
              type: 'application/json',
              screenshots: [
                {
                  src: '/screenshots/screenshot-mobile.png',
                  sizes: '720x1280',
                  label: 'Quick Code Widget'
                }
              ],
              url: '/#ide'
            }
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/screenshots/screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Borland Turbo C++ 3.0 Desktop IDE with graphics.h compiler',
            },
            {
              src: '/screenshots/screenshot-mobile.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Turbo C++ Mobile IDE with Virtual Touch Keyboard and conio.h',
            },
          ],
          shortcuts: [
            {
              name: 'Launch Web IDE',
              short_name: 'IDE',
              description: 'Open Borland Turbo C++ 3.0 Web IDE',
              url: '/#ide',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
            {
              name: 'New C++ Project',
              short_name: 'New Project',
              description: 'Create a new C++ source file in Turbo C++',
              url: '/#ide?action=new',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
            {
              name: 'Open Sample Programs',
              short_name: 'Samples',
              description: 'Browse and run sample C++ programs',
              url: '/#ide?action=samples',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
            {
              name: 'Settings',
              short_name: 'Settings',
              description: 'Configure IDE settings and preferences',
              url: '/#ide?action=settings',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
          ],
          share_target: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
              files: [
                {
                  name: 'file',
                  accept: ['text/x-c++src', '.cpp', '.c', '.h', '.hpp', 'text/plain']
                }
              ]
            }
          },
          file_handlers: [
            {
              action: '/#ide',
              accept: {
                'text/x-c++src': ['.cpp', '.cxx', '.cc'],
                'text/x-csrc': ['.c'],
                'text/x-chdr': ['.h', '.hpp', '.hxx']
              }
            }
          ],
          protocol_handlers: [
            {
              protocol: 'web+turbocpp',
              url: '/#ide?code=%s'
            }
          ],
          launch_handler: {
            client_mode: ['navigate-existing', 'auto']
          },
          display_override: ['window-controls-overlay', 'tabbed', 'standalone', 'fullscreen', 'minimal-ui'],
          edge_side_panel: {
            preferred_width: 400
          },
          handle_links: 'preferred',
          iarc_rating_id: '',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
