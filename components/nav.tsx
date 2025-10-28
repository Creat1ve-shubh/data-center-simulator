'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Lightbulb,
  Map,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Activity,
    description: 'Overview and sustainability score',
  },
  {
    name: 'Efficiency',
    href: '/efficiency',
    icon: BarChart3,
    description: 'Energy efficiency optimization',
  },
  {
    name: 'Roadmap',
    href: '/roadmap',
    icon: Map,
    description: 'Renewable energy transition plan',
  },
  {
    name: 'Telemetry',
    href: '/telemetry',
    icon: Activity,
    description: 'Real-time monitoring',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Analytics and reports',
  },
  {
    name: 'Case Studies',
    href: '/case-studies',
    icon: Lightbulb,
    description: 'Real-world examples',
  },
  {
    name: 'Documentation',
    href: '/docs',
    icon: BookOpen,
    description: 'Technical documentation',
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">
                  GreenCloud
                </span>
                <span className="text-xs text-gray-500">
                  Data Center Optimizer
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    title={item.description}
                  >
                    <Icon
                      className={cn(
                        'mr-2 h-4 w-4',
                        isActive
                          ? 'text-green-600'
                          : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Status indicator */}
          <div className="flex items-center space-x-4">
            <div className="hidden items-center space-x-2 sm:flex">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="border-t border-gray-200 md:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-4 w-4',
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
