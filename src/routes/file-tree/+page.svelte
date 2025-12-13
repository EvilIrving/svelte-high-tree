<script lang="ts">
	import { createCompressedTreeManager, type FileEvent } from '$lib/file-tree';
	import FileTree from '$lib/components/FileTree.svelte';

	const manager = createCompressedTreeManager();

	const mockEvents: FileEvent[] = [
		// project 根目录下的多个同级目录和文件

		// src 目录 - 多层嵌套,同级目录多
		{
			type: 'file',
			name: 'index.ts',
			id: 'file-1',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' }
			]
		},
		{
			type: 'file',
			name: 'app.ts',
			id: 'file-2',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' }
			]
		},
		{
			type: 'file',
			name: 'config.ts',
			id: 'file-3',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' }
			]
		},

		// src/components - 多个同级子目录
		{
			type: 'file',
			name: 'Button.tsx',
			id: 'file-4',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'buttons', id: 'folder-buttons' }
			]
		},
		{
			type: 'file',
			name: 'IconButton.tsx',
			id: 'file-5',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'buttons', id: 'folder-buttons' }
			]
		},
		{
			type: 'file',
			name: 'Input.tsx',
			id: 'file-6',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'forms', id: 'folder-forms' }
			]
		},
		{
			type: 'file',
			name: 'Select.tsx',
			id: 'file-7',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'forms', id: 'folder-forms' }
			]
		},
		{
			type: 'file',
			name: 'Checkbox.tsx',
			id: 'file-8',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'forms', id: 'folder-forms' }
			]
		},
		{
			type: 'file',
			name: 'Modal.tsx',
			id: 'file-9',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'overlays', id: 'folder-overlays' }
			]
		},
		{
			type: 'file',
			name: 'Drawer.tsx',
			id: 'file-10',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'overlays', id: 'folder-overlays' }
			]
		},
		{
			type: 'file',
			name: 'Tooltip.tsx',
			id: 'file-11',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'overlays', id: 'folder-overlays' }
			]
		},
		{
			type: 'file',
			name: 'Table.tsx',
			id: 'file-12',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'data-display', id: 'folder-data-display' }
			]
		},
		{
			type: 'file',
			name: 'List.tsx',
			id: 'file-13',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'data-display', id: 'folder-data-display' }
			]
		},
		{
			type: 'file',
			name: 'Card.tsx',
			id: 'file-14',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'ui', id: 'folder-ui' },
				{ type: 'folder', name: 'data-display', id: 'folder-data-display' }
			]
		},

		// src/components/layout - 布局组件
		{
			type: 'file',
			name: 'Header.tsx',
			id: 'file-15',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'layout', id: 'folder-layout' }
			]
		},
		{
			type: 'file',
			name: 'Footer.tsx',
			id: 'file-16',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'layout', id: 'folder-layout' }
			]
		},
		{
			type: 'file',
			name: 'Sidebar.tsx',
			id: 'file-17',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'layout', id: 'folder-layout' }
			]
		},
		{
			type: 'file',
			name: 'Container.tsx',
			id: 'file-18',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'components', id: 'folder-components' },
				{ type: 'folder', name: 'layout', id: 'folder-layout' }
			]
		},

		// src/services - 多个服务
		{
			type: 'file',
			name: 'UserService.ts',
			id: 'file-19',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'api', id: 'folder-api' }
			]
		},
		{
			type: 'file',
			name: 'AuthService.ts',
			id: 'file-20',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'api', id: 'folder-api' }
			]
		},
		{
			type: 'file',
			name: 'ProductService.ts',
			id: 'file-21',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'api', id: 'folder-api' }
			]
		},
		{
			type: 'file',
			name: 'OrderService.ts',
			id: 'file-22',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'api', id: 'folder-api' }
			]
		},
		{
			type: 'file',
			name: 'StorageService.ts',
			id: 'file-23',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'storage', id: 'folder-storage' }
			]
		},
		{
			type: 'file',
			name: 'CacheService.ts',
			id: 'file-24',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'storage', id: 'folder-storage' }
			]
		},
		{
			type: 'file',
			name: 'NotificationService.ts',
			id: 'file-25',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'messaging', id: 'folder-messaging' }
			]
		},
		{
			type: 'file',
			name: 'EmailService.ts',
			id: 'file-26',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'services', id: 'folder-services' },
				{ type: 'folder', name: 'messaging', id: 'folder-messaging' }
			]
		},

		// src/utils - 工具函数,多层嵌套
		{
			type: 'file',
			name: 'formatDate.ts',
			id: 'file-27',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'date', id: 'folder-date' }
			]
		},
		{
			type: 'file',
			name: 'parseDate.ts',
			id: 'file-28',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'date', id: 'folder-date' }
			]
		},
		{
			type: 'file',
			name: 'formatCurrency.ts',
			id: 'file-29',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'formatters', id: 'folder-formatters' }
			]
		},
		{
			type: 'file',
			name: 'formatNumber.ts',
			id: 'file-30',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'formatters', id: 'folder-formatters' }
			]
		},
		{
			type: 'file',
			name: 'validateEmail.ts',
			id: 'file-31',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'validators', id: 'folder-validators' }
			]
		},
		{
			type: 'file',
			name: 'validatePhone.ts',
			id: 'file-32',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'validators', id: 'folder-validators' }
			]
		},
		{
			type: 'file',
			name: 'debounce.ts',
			id: 'file-33',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'helpers', id: 'folder-helpers' }
			]
		},
		{
			type: 'file',
			name: 'throttle.ts',
			id: 'file-34',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'helpers', id: 'folder-helpers' }
			]
		},
		{
			type: 'file',
			name: 'deepClone.ts',
			id: 'file-35',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'utils', id: 'folder-utils' },
				{ type: 'folder', name: 'helpers', id: 'folder-helpers' }
			]
		},

		// src/store - 状态管理
		{
			type: 'file',
			name: 'userStore.ts',
			id: 'file-36',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'store', id: 'folder-store' },
				{ type: 'folder', name: 'modules', id: 'folder-modules' }
			]
		},
		{
			type: 'file',
			name: 'cartStore.ts',
			id: 'file-37',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'store', id: 'folder-store' },
				{ type: 'folder', name: 'modules', id: 'folder-modules' }
			]
		},
		{
			type: 'file',
			name: 'appStore.ts',
			id: 'file-38',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'store', id: 'folder-store' },
				{ type: 'folder', name: 'modules', id: 'folder-modules' }
			]
		},

		// src/hooks - React hooks
		{
			type: 'file',
			name: 'useAuth.ts',
			id: 'file-39',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'hooks', id: 'folder-hooks' }
			]
		},
		{
			type: 'file',
			name: 'useLocalStorage.ts',
			id: 'file-40',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'hooks', id: 'folder-hooks' }
			]
		},
		{
			type: 'file',
			name: 'useDebounce.ts',
			id: 'file-41',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'hooks', id: 'folder-hooks' }
			]
		},
		{
			type: 'file',
			name: 'useMediaQuery.ts',
			id: 'file-42',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'src', id: 'folder-src' },
				{ type: 'folder', name: 'hooks', id: 'folder-hooks' }
			]
		},

		// tests 目录 - 多层测试文件
		{
			type: 'file',
			name: 'Button.test.tsx',
			id: 'file-43',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'components', id: 'folder-test-components' }
			]
		},
		{
			type: 'file',
			name: 'Modal.test.tsx',
			id: 'file-44',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'components', id: 'folder-test-components' }
			]
		},
		{
			type: 'file',
			name: 'UserService.test.ts',
			id: 'file-45',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'services', id: 'folder-test-services' }
			]
		},
		{
			type: 'file',
			name: 'AuthService.test.ts',
			id: 'file-46',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'services', id: 'folder-test-services' }
			]
		},
		{
			type: 'file',
			name: 'formatDate.test.ts',
			id: 'file-47',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'utils', id: 'folder-test-utils' }
			]
		},
		{
			type: 'file',
			name: 'validators.test.ts',
			id: 'file-48',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'unit', id: 'folder-unit' },
				{ type: 'folder', name: 'utils', id: 'folder-test-utils' }
			]
		},
		{
			type: 'file',
			name: 'login.e2e.ts',
			id: 'file-49',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'e2e', id: 'folder-e2e' },
				{ type: 'folder', name: 'auth', id: 'folder-e2e-auth' }
			]
		},
		{
			type: 'file',
			name: 'checkout.e2e.ts',
			id: 'file-50',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'e2e', id: 'folder-e2e' },
				{ type: 'folder', name: 'shopping', id: 'folder-e2e-shopping' }
			]
		},
		{
			type: 'file',
			name: 'search.e2e.ts',
			id: 'file-51',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'tests', id: 'folder-tests' },
				{ type: 'folder', name: 'e2e', id: 'folder-e2e' },
				{ type: 'folder', name: 'features', id: 'folder-e2e-features' }
			]
		},

		// config 目录 - 配置文件
		{
			type: 'file',
			name: 'webpack.dev.js',
			id: 'file-52',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'webpack', id: 'folder-webpack' }
			]
		},
		{
			type: 'file',
			name: 'webpack.prod.js',
			id: 'file-53',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'webpack', id: 'folder-webpack' }
			]
		},
		{
			type: 'file',
			name: 'webpack.common.js',
			id: 'file-54',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'webpack', id: 'folder-webpack' }
			]
		},
		{
			type: 'file',
			name: 'jest.config.js',
			id: 'file-55',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'jest', id: 'folder-jest' }
			]
		},
		{
			type: 'file',
			name: 'setupTests.ts',
			id: 'file-56',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'jest', id: 'folder-jest' }
			]
		},
		{
			type: 'file',
			name: 'eslint.config.js',
			id: 'file-57',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'linters', id: 'folder-linters' }
			]
		},
		{
			type: 'file',
			name: 'prettier.config.js',
			id: 'file-58',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'linters', id: 'folder-linters' }
			]
		},
		{
			type: 'file',
			name: 'env.development',
			id: 'file-59',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'environments', id: 'folder-environments' }
			]
		},
		{
			type: 'file',
			name: 'env.production',
			id: 'file-60',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'environments', id: 'folder-environments' }
			]
		},
		{
			type: 'file',
			name: 'env.staging',
			id: 'file-61',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'config', id: 'folder-config' },
				{ type: 'folder', name: 'environments', id: 'folder-environments' }
			]
		},

		// assets 目录 - 资源文件
		{
			type: 'file',
			name: 'logo.svg',
			id: 'file-62',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'brand', id: 'folder-brand' }
			]
		},
		{
			type: 'file',
			name: 'favicon.ico',
			id: 'file-63',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'brand', id: 'folder-brand' }
			]
		},
		{
			type: 'file',
			name: 'hero.jpg',
			id: 'file-64',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'photos', id: 'folder-photos' }
			]
		},
		{
			type: 'file',
			name: 'banner.png',
			id: 'file-65',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'photos', id: 'folder-photos' }
			]
		},
		{
			type: 'file',
			name: 'check.svg',
			id: 'file-66',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'icons', id: 'folder-icons' }
			]
		},
		{
			type: 'file',
			name: 'arrow.svg',
			id: 'file-67',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'icons', id: 'folder-icons' }
			]
		},
		{
			type: 'file',
			name: 'close.svg',
			id: 'file-68',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'images', id: 'folder-images' },
				{ type: 'folder', name: 'icons', id: 'folder-icons' }
			]
		},
		{
			type: 'file',
			name: 'variables.scss',
			id: 'file-69',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'base', id: 'folder-base' }
			]
		},
		{
			type: 'file',
			name: 'mixins.scss',
			id: 'file-70',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'base', id: 'folder-base' }
			]
		},
		{
			type: 'file',
			name: 'reset.scss',
			id: 'file-71',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'base', id: 'folder-base' }
			]
		},
		{
			type: 'file',
			name: 'buttons.scss',
			id: 'file-72',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'components', id: 'folder-style-components' }
			]
		},
		{
			type: 'file',
			name: 'forms.scss',
			id: 'file-73',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'components', id: 'folder-style-components' }
			]
		},
		{
			type: 'file',
			name: 'cards.scss',
			id: 'file-74',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'styles', id: 'folder-styles' },
				{ type: 'folder', name: 'components', id: 'folder-style-components' }
			]
		},
		{
			type: 'file',
			name: 'Roboto-Regular.woff2',
			id: 'file-75',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'fonts', id: 'folder-fonts' }
			]
		},
		{
			type: 'file',
			name: 'Roboto-Bold.woff2',
			id: 'file-76',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'assets', id: 'folder-assets' },
				{ type: 'folder', name: 'fonts', id: 'folder-fonts' }
			]
		},

		// docs 目录 - 文档
		{
			type: 'file',
			name: 'README.md',
			id: 'file-77',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' }
			]
		},
		{
			type: 'file',
			name: 'CONTRIBUTING.md',
			id: 'file-78',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' }
			]
		},
		{
			type: 'file',
			name: 'API.md',
			id: 'file-79',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' },
				{ type: 'folder', name: 'api', id: 'folder-api-docs' }
			]
		},
		{
			type: 'file',
			name: 'authentication.md',
			id: 'file-80',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' },
				{ type: 'folder', name: 'api', id: 'folder-api-docs' }
			]
		},
		{
			type: 'file',
			name: 'setup-guide.md',
			id: 'file-81',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' },
				{ type: 'folder', name: 'guides', id: 'folder-guides' }
			]
		},
		{
			type: 'file',
			name: 'deployment.md',
			id: 'file-82',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docs', id: 'folder-docs' },
				{ type: 'folder', name: 'guides', id: 'folder-guides' }
			]
		},

		// database 目录
		{
			type: 'file',
			name: '001_initial.sql',
			id: 'file-83',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'database', id: 'folder-database' },
				{ type: 'folder', name: 'migrations', id: 'folder-migrations' }
			]
		},
		{
			type: 'file',
			name: '002_add_users.sql',
			id: 'file-84',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'database', id: 'folder-database' },
				{ type: 'folder', name: 'migrations', id: 'folder-migrations' }
			]
		},
		{
			type: 'file',
			name: '003_add_products.sql',
			id: 'file-85',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'database', id: 'folder-database' },
				{ type: 'folder', name: 'migrations', id: 'folder-migrations' }
			]
		},
		{
			type: 'file',
			name: 'users.seed.ts',
			id: 'file-86',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'database', id: 'folder-database' },
				{ type: 'folder', name: 'seeds', id: 'folder-seeds' }
			]
		},
		{
			type: 'file',
			name: 'products.seed.ts',
			id: 'file-87',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'database', id: 'folder-database' },
				{ type: 'folder', name: 'seeds', id: 'folder-seeds' }
			]
		},

		// scripts 目录
		{
			type: 'file',
			name: 'build.sh',
			id: 'file-88',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'scripts', id: 'folder-scripts' }
			]
		},
		{
			type: 'file',
			name: 'deploy.sh',
			id: 'file-89',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'scripts', id: 'folder-scripts' }
			]
		},
		{
			type: 'file',
			name: 'test.sh',
			id: 'file-90',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'scripts', id: 'folder-scripts' }
			]
		},

		// docker 目录
		{
			type: 'file',
			name: 'Dockerfile',
			id: 'file-91',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docker', id: 'folder-docker' }
			]
		},
		{
			type: 'file',
			name: 'docker-compose.yml',
			id: 'file-92',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docker', id: 'folder-docker' }
			]
		},
		{
			type: 'file',
			name: 'nginx.conf',
			id: 'file-93',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'docker', id: 'folder-docker' },
				{ type: 'folder', name: 'nginx', id: 'folder-nginx' }
			]
		},

		// public 目录
		{
			type: 'file',
			name: 'index.html',
			id: 'file-94',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'public', id: 'folder-public' }
			]
		},
		{
			type: 'file',
			name: 'robots.txt',
			id: 'file-95',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'public', id: 'folder-public' }
			]
		},
		{
			type: 'file',
			name: 'sitemap.xml',
			id: 'file-96',
			parent: [
				{ type: 'folder', name: 'project', id: 'folder-root' },
				{ type: 'folder', name: 'public', id: 'folder-public' }
			]
		},

		// 根目录文件
		{
			type: 'file',
			name: 'package.json',
			id: 'file-97',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		},
		{
			type: 'file',
			name: 'package-lock.json',
			id: 'file-98',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		},
		{
			type: 'file',
			name: 'tsconfig.json',
			id: 'file-99',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		},
		{
			type: 'file',
			name: '.gitignore',
			id: 'file-100',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		},
		{
			type: 'file',
			name: '.env.example',
			id: 'file-101',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		},
		{
			type: 'file',
			name: 'README.md',
			id: 'file-102',
			parent: [{ type: 'folder', name: 'project', id: 'folder-root' }]
		}
	];

	let currentEventIndex = $state(0);
	let eventLog = $state<string[]>([]);

	// 添加下一个文件事件
	function addNextFile() {
		if (currentEventIndex >= mockEvents.length) return;

		const event = mockEvents[currentEventIndex];
		manager.addFile(event);

		// 记录日志
		const parentPath = event.parent.map((p) => p.name).join('/');
		eventLog = [...eventLog, `添加: ${parentPath}/${event.name}`];

		currentEventIndex++;
	}

	// 批量添加所有文件
	function addAllFiles() {
		const remaining = mockEvents.slice(currentEventIndex);
		manager.addFiles(remaining);

		for (const event of remaining) {
			const parentPath = event.parent.map((p) => p.name).join('/');
			eventLog = [...eventLog, `添加: ${parentPath}/${event.name}`];
		}

		currentEventIndex = mockEvents.length;
	}

	// 重置
	function reset() {
		manager.clear();
		currentEventIndex = 0;
		eventLog = [];
	}

	// 初始展开全部
	$effect(() => {
		if (manager.flatNodes.length > 0) {
			manager.expandAll();
		}
	});
</script>

<div class="demo-container">
	<div class="demo-header">
		<h1>增量路径压缩文件树 Demo</h1>
		<p>演示 AI 生成文件时的增量更新和路径压缩</p>
	</div>

	<div class="demo-content">
		<!-- 左侧：控制面板 -->
		<div class="control-panel">
			<div class="controls">
				<button onclick={addNextFile} disabled={currentEventIndex >= mockEvents.length}>
					添加下一个文件 ({currentEventIndex}/{mockEvents.length})
				</button>
				<button onclick={addAllFiles} disabled={currentEventIndex >= mockEvents.length}>
					添加所有文件
				</button>
				<button onclick={reset}>重置</button>
			</div>

			<div class="stats">
				<div>总节点: {manager.totalNodeCount}</div>
				<div>可见节点: {manager.visibleNodeCount}</div>
				<div>
					已选: {manager.selectedId ? (manager.getNode(manager.selectedId)?.name ?? '无') : '无'}
				</div>
			</div>

			<div class="event-log">
				<h3>事件日志</h3>
				<div class="log-list">
					{#each eventLog as log, i}
						<div class="log-item">{i + 1}. {log}</div>
					{/each}
					{#if eventLog.length === 0}
						<div class="log-empty">暂无事件</div>
					{/if}
				</div>
			</div>

			<div class="hint">
				<h3>路径压缩规则</h3>
				<ul>
					<li>单子目录链会被压缩为 A/B/C 形式</li>
					<li>新增文件可能触发拆解</li>
					<li>源数据结构始终保持不变</li>
				</ul>
			</div>
		</div>

		<!-- 右侧：文件树 -->
		<div class="tree-panel">
			<div class="tree-toolbar">
				<button onclick={() => manager.expandAll()}>全部展开</button>
				<button onclick={() => manager.collapseAll()}>全部收起</button>
			</div>
			<div class="tree-wrapper">
				<FileTree
					visibleList={manager.visibleList}
					flatNodes={manager.flatNodes}
					expandedSet={manager.expandedSet}
					selectedId={manager.selectedId}
					index={manager.index}
					itemHeight={32}
					onToggleExpand={(id) => manager.toggleExpand(id)}
					onSelect={(id) => manager.selectNode(id)}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.demo-header h1 {
		margin: 0 0 8px;
		font-size: 24px;
		color: #333;
	}

	.demo-header p {
		margin: 0;
		color: #666;
	}

	.demo-content {
		display: flex;
		gap: 24px;
	}

	.control-panel {
		width: 320px;
		flex-shrink: 0;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.controls button {
		padding: 10px 16px;
		font-size: 14px;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
		transition: all 0.2s;
	}

	.controls button:hover:not(:disabled) {
		border-color: #1890ff;
		color: #1890ff;
	}

	.controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.stats {
		padding: 12px;
		background: #f5f5f5;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
		color: #666;
	}

	.stats div {
		margin-bottom: 4px;
	}

	.event-log {
		margin-bottom: 16px;
	}

	.event-log h3 {
		margin: 0 0 8px;
		font-size: 14px;
		color: #333;
	}

	.log-list {
		max-height: 200px;
		overflow-y: auto;
		background: #fafafa;
		border: 1px solid #eee;
		border-radius: 6px;
		padding: 8px;
	}

	.log-item {
		font-size: 12px;
		color: #666;
		padding: 4px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.log-item:last-child {
		border-bottom: none;
	}

	.log-empty {
		font-size: 12px;
		color: #999;
		text-align: center;
		padding: 16px;
	}

	.hint {
		background: #e6f7ff;
		border: 1px solid #91d5ff;
		border-radius: 6px;
		padding: 12px;
	}

	.hint h3 {
		margin: 0 0 8px;
		font-size: 14px;
		color: #1890ff;
	}

	.hint ul {
		margin: 0;
		padding-left: 20px;
		font-size: 12px;
		color: #666;
	}

	.hint li {
		margin-bottom: 4px;
	}

	.tree-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		overflow: hidden;
	}

	.tree-toolbar {
		display: flex;
		gap: 8px;
		padding: 8px;
		background: #fafafa;
		border-bottom: 1px solid #d9d9d9;
	}

	.tree-toolbar button {
		padding: 4px 12px;
		font-size: 12px;
		border: 1px solid #d9d9d9;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
	}

	.tree-toolbar button:hover {
		border-color: #1890ff;
		color: #1890ff;
	}

	.tree-wrapper {
		flex: 1;
		height: 500px;
        position: relative;
        overflow: auto;
	}
</style>
